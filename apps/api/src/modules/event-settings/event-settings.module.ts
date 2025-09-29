import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { EventSettingsController } from './event-settings.controller';
import { EventSettingsService } from './event-settings.service';
import { EventSettings, EventSettingsSchema } from './schemas/event-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EventSettings.name, schema: EventSettingsSchema }]),
    CacheModule.register({
      ttl: 300, // 5 minutes default TTL in seconds
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [EventSettingsController],
  providers: [EventSettingsService],
  exports: [EventSettingsService],
})
export class EventSettingsModule {}
