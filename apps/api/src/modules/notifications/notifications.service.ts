import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
} from './schemas/notification.schema';
import { DeviceToken, DeviceTokenDocument } from './schemas/device-token.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { sanitizeNotification } from '@common/utils/sanitize.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(DeviceToken.name)
    private deviceTokenModel: Model<DeviceTokenDocument>,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  // Legacy methods (kept for backward compatibility)
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Sending email to ${to}: ${subject} - Body: ${body}`);
    // TODO: Implement email sending logic (SendGrid, AWS SES, etc.)
  }

  async sendPushNotification(userId: string, title: string, message: string): Promise<void> {
    this.logger.log(`Sending push notification to user ${userId}: ${title} - Message: ${message}`);
    // TODO: Implement push notification logic (FCM, APNS, etc.)
  }

  async sendSessionReminder(userId: string, sessionId: string): Promise<void> {
    this.logger.log(`Sending session reminder to user ${userId} for session ${sessionId}`);
    // TODO: Implement session reminder logic
  }

  async broadcastNotification(title: string, message: string): Promise<void> {
    // Sanitize user inputs to prevent XSS attacks
    const sanitized = sanitizeNotification({ title, message });

    this.logger.log(
      `Broadcasting notification: ${sanitized.title} - Message: ${sanitized.message}`,
    );
    // TODO: Implement broadcast logic
  }

  // New notification management methods
  async createNotification(
    dto: CreateNotificationDto,
    userId: string,
  ): Promise<NotificationDocument> {
    // Sanitize user inputs to prevent XSS attacks
    const sanitizedDto = sanitizeNotification(dto);

    const deviceCount = await this.deviceTokenModel.countDocuments();

    const notification = new this.notificationModel({
      ...sanitizedDto,
      createdBy: new Types.ObjectId(userId),
      deviceCount,
      status: dto.scheduledAt
        ? NotificationStatus.SCHEDULED
        : dto.status || NotificationStatus.DRAFT,
    });

    const saved = await notification.save();

    // Schedule notification if scheduledAt is provided
    if (dto.scheduledAt) {
      await this.scheduleNotification(saved._id.toString(), dto.scheduledAt);
    }

    return saved;
  }

  async scheduleNotification(notificationId: string, scheduledAt: Date): Promise<void> {
    const delay = scheduledAt.getTime() - Date.now();

    if (delay < 0) {
      throw new Error('Cannot schedule notification in the past');
    }

    await this.notificationQueue.add(
      'send-notification',
      { notificationId },
      { delay, removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    this.logger.log(`Notification ${notificationId} scheduled for ${scheduledAt.toISOString()}`);
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: NotificationStatus,
    createdBy?: string,
  ): Promise<{
    data: NotificationDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (createdBy) {
      query.createdBy = new Types.ObjectId(createdBy);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .exec(),
      this.notificationModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findById(id)
      .populate('createdBy', 'name email')
      .exec();

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async updateNotification(id: string, dto: UpdateNotificationDto): Promise<NotificationDocument> {
    // Sanitize user inputs to prevent XSS attacks
    const sanitizedDto = sanitizeNotification(dto);

    const notification = await this.notificationModel
      .findByIdAndUpdate(id, sanitizedDto, { new: true })
      .exec();

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Reschedule if scheduledAt changed
    if (dto.scheduledAt && notification.status === NotificationStatus.SCHEDULED) {
      // Remove old job and create new one
      await this.cancelScheduledNotification(id);
      await this.scheduleNotification(id, dto.scheduledAt);
    }

    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    const result = await this.notificationModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Cancel scheduled job if exists
    if (result.status === NotificationStatus.SCHEDULED) {
      await this.cancelScheduledNotification(id);
    }
  }

  async cancelScheduledNotification(id: string): Promise<void> {
    const jobs = await this.notificationQueue.getJobs(['delayed', 'waiting']);

    for (const job of jobs) {
      if (job.data.notificationId === id) {
        await job.remove();
        this.logger.log(`Cancelled scheduled notification job for ${id}`);
      }
    }

    await this.notificationModel.findByIdAndUpdate(id, {
      status: NotificationStatus.DRAFT,
    });
  }

  async getHistory(
    page = 1,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
    createdBy?: string,
    search?: string,
  ): Promise<{
    data: NotificationDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = {
      status: { $in: [NotificationStatus.SENT, NotificationStatus.FAILED] },
    };

    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = startDate;
      if (endDate) query.sentAt.$lte = endDate;
    }

    if (createdBy) {
      query.createdBy = new Types.ObjectId(createdBy);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .exec(),
      this.notificationModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    totalScheduled: number;
    totalDevices: number;
    deliveryRate: number;
  }> {
    const [totalSent, totalFailed, totalScheduled, totalDevices] = await Promise.all([
      this.notificationModel.countDocuments({
        status: NotificationStatus.SENT,
      }),
      this.notificationModel.countDocuments({
        status: NotificationStatus.FAILED,
      }),
      this.notificationModel.countDocuments({
        status: NotificationStatus.SCHEDULED,
      }),
      this.deviceTokenModel.countDocuments(),
    ]);

    const deliveryRate =
      totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;

    return {
      totalSent,
      totalFailed,
      totalScheduled,
      totalDevices,
      deliveryRate,
    };
  }

  // Device token management
  async registerDevice(dto: RegisterDeviceDto, userId?: string): Promise<DeviceTokenDocument> {
    const existing = await this.deviceTokenModel.findOne({ token: dto.token });

    if (existing) {
      existing.userId = userId ? new Types.ObjectId(userId) : existing.userId;
      existing.platform = dto.platform;
      existing.appVersion = dto.appVersion;
      existing.isTestDevice = dto.isTestDevice ?? existing.isTestDevice;
      existing.lastActive = new Date();
      return existing.save();
    }

    const deviceToken = new this.deviceTokenModel({
      ...dto,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      lastActive: new Date(),
    });

    return deviceToken.save();
  }

  async getTestDevices(): Promise<DeviceTokenDocument[]> {
    return this.deviceTokenModel.find({ isTestDevice: true }).sort({ lastActive: -1 }).exec();
  }

  async sendTestNotification(title: string, message: string, deviceTokenId: string): Promise<void> {
    // Sanitize user inputs to prevent XSS attacks
    const sanitized = sanitizeNotification({ title, message });

    const device = await this.deviceTokenModel.findById(deviceTokenId);

    if (!device) {
      throw new NotFoundException(`Device token with ID ${deviceTokenId} not found`);
    }

    this.logger.log(
      `Sending test notification to device ${deviceTokenId}: ${sanitized.title} - ${sanitized.message}`,
    );

    // Decrypt token for use (tokens are encrypted at rest)
    // const decryptedToken = (device as any).getDecryptedToken();

    // TODO: Implement actual push notification sending via FCM/APNS
    // When implementing, use: const token = (device as any).getDecryptedToken();
    // For now, just log it (don't log the actual token in production)
    this.logger.log(`Test notification would be sent to ${device.platform} device`);
  }

  // Actual notification delivery (called by queue processor)
  async deliverNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationModel.findById(notificationId);

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    // Update status to sending
    notification.status = NotificationStatus.SENDING;
    await notification.save();

    try {
      // Get all active device tokens
      const devices = await this.deviceTokenModel.find({
        isTestDevice: false,
      });

      let delivered = 0;
      let failed = 0;

      // TODO: Implement actual FCM/APNS sending logic
      // For now, simulate delivery
      for (const device of devices) {
        try {
          this.logger.log(
            `Sending to ${device.platform} device: ${device.token.substring(0, 20)}...`,
          );
          delivered++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Failed to send to device ${device._id}: ${errorMessage}`);
          failed++;
        }
      }

      // Update notification with delivery stats
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      notification.deliveredCount = delivered;
      notification.failedCount = failed;
      await notification.save();

      this.logger.log(
        `Notification ${notificationId} delivered: ${delivered} succeeded, ${failed} failed`,
      );
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      await notification.save();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to deliver notification ${notificationId}: ${errorMessage}`);
      throw error;
    }
  }
}
