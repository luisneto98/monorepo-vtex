import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationThrottleGuard } from '@common/guards/notification-throttle.guard';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { DeviceToken, DeviceTokenSchema } from './schemas/device-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor, NotificationThrottleGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
