import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@shared/types/user.types';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
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
}
