import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send-notification')
  async handleSendNotification(job: Job): Promise<void> {
    const { notificationId } = job.data;

    this.logger.log(`Processing notification ${notificationId}`);

    try {
      await this.notificationsService.deliverNotification(notificationId);
      this.logger.log(`Successfully delivered notification ${notificationId}`);
    } catch (error: any) {
      this.logger.error(`Failed to deliver notification ${notificationId}: ${error?.message || 'Unknown error'}`);
      throw error; // This will trigger Bull's retry mechanism
    }
  }
}
