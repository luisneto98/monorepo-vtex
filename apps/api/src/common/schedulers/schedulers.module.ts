import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { VisibilityScheduler } from './visibility.scheduler';
import { SystemConfigModule } from '../../modules/system-config/system-config.module';

@Module({
  imports: [ScheduleModule.forRoot(), SystemConfigModule],
  providers: [VisibilityScheduler],
})
export class SchedulersModule {}
