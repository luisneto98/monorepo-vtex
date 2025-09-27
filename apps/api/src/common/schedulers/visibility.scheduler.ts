import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SystemConfigService } from '../../modules/system-config/system-config.service';

@Injectable()
export class VisibilityScheduler {
  private readonly logger = new Logger(VisibilityScheduler.name);

  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledVisibilityChanges() {
    try {
      this.logger.debug('Checking for scheduled visibility changes...');
      await this.systemConfigService.applyScheduledChanges();
    } catch (error) {
      this.logger.error('Failed to apply scheduled visibility changes', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldAuditLogs() {
    try {
      this.logger.debug('Starting audit log cleanup...');
      // Cleanup logic for audit logs older than 90 days
      const retentionDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await this.systemConfigService.cleanupAuditLogs(cutoffDate);
      this.logger.debug(`Audit log cleanup completed. Deleted ${deletedCount} old records.`);
    } catch (error) {
      this.logger.error('Failed to cleanup audit logs', error);
    }
  }
}