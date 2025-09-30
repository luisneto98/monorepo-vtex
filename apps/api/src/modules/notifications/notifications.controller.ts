import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { NotificationThrottleGuard } from '@common/guards/notification-throttle.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { NotificationThrottle } from '@common/decorators/notification-throttle.decorator';
import { UserRole } from '@shared/types/user.types';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { TestNotificationDto } from './dto/test-notification.dto';
import { NotificationStatus } from './schemas/notification.schema';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Legacy endpoints (kept for backward compatibility)
  @Post('broadcast')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @UseGuards(NotificationThrottleGuard)
  @NotificationThrottle({ ttl: 3600000, limit: 10 }) // 10 notifications per hour
  async broadcast(@Body() dto: { title: string; message: string }) {
    await this.notificationsService.broadcastNotification(dto.title, dto.message);
    return { message: 'Notification sent successfully' };
  }

  @Post('session-reminder')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async sendSessionReminder(@Body() dto: { userId: string; sessionId: string }) {
    await this.notificationsService.sendSessionReminder(dto.userId, dto.sessionId);
    return { message: 'Reminder sent successfully' };
  }

  // New notification management endpoints
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @UseGuards(NotificationThrottleGuard)
  @NotificationThrottle({ ttl: 3600000, limit: 10 }) // 10 notifications per hour
  async createNotification(@Body() dto: CreateNotificationDto, @Request() req: any) {
    const notification = await this.notificationsService.createNotification(dto, req.user.userId);
    return notification;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: NotificationStatus,
    @Query('createdBy') createdBy?: string,
  ) {
    return this.notificationsService.findAll(page, limit, status, createdBy);
  }

  @Get('history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async getHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('createdBy') createdBy?: string,
    @Query('search') search?: string,
  ) {
    return this.notificationsService.getHistory(
      page,
      limit,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      createdBy,
      search,
    );
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async getStats() {
    return this.notificationsService.getStats();
  }

  @Get('scheduled')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async getScheduled(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.notificationsService.findAll(page, limit, NotificationStatus.SCHEDULED);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async updateNotification(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationsService.updateNotification(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async deleteNotification(@Param('id') id: string) {
    await this.notificationsService.deleteNotification(id);
    return { message: 'Notification deleted successfully' };
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async cancelScheduled(@Param('id') id: string) {
    await this.notificationsService.cancelScheduledNotification(id);
    return { message: 'Scheduled notification cancelled' };
  }

  @Post('schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @UseGuards(NotificationThrottleGuard)
  @NotificationThrottle({ ttl: 3600000, limit: 10 }) // 10 notifications per hour
  async scheduleNotification(@Body() dto: CreateNotificationDto, @Request() req: any) {
    if (!dto.scheduledAt) {
      return { error: 'scheduledAt is required for scheduled notifications' };
    }

    const notification = await this.notificationsService.createNotification(dto, req.user.userId);
    return notification;
  }

  // Device management endpoints
  @Public() // Allow unauthenticated access for visitor mode device registration
  @Post('devices/register')
  async registerDevice(@Body() dto: RegisterDeviceDto, @Request() req: any) {
    const userId = req.user?.userId;
    return this.notificationsService.registerDevice(dto, userId);
  }

  @Get('devices/test')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  async getTestDevices() {
    return this.notificationsService.getTestDevices();
  }

  @Post('test')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @UseGuards(NotificationThrottleGuard)
  @NotificationThrottle({ ttl: 3600000, limit: 10 }) // 10 notifications per hour
  async sendTest(@Body() dto: TestNotificationDto) {
    await this.notificationsService.sendTestNotification(dto.title, dto.message, dto.deviceTokenId);
    return { message: 'Test notification sent successfully' };
  }
}
