import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SpeakersModule } from './modules/speakers/speakers.module';
import { SponsorsModule } from './modules/sponsors/sponsors.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DatabaseModule } from './modules/database/database.module';
import { FaqModule } from './modules/faq/faq.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { EventSettingsModule } from './modules/event-settings/event-settings.module';
import { PressMaterialsModule } from './modules/press-materials/press-materials.module';
import { NewsReleasesModule } from './modules/news-releases/news-releases.module';
import { LegalPagesModule } from './modules/legal-pages/legal-pages.module';
import { SchedulersModule } from './common/schedulers/schedulers.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute default
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    SpeakersModule,
    SponsorsModule,
    NotificationsModule,
    FaqModule,
    SystemConfigModule,
    EventSettingsModule,
    PressMaterialsModule,
    NewsReleasesModule,
    LegalPagesModule,
    SchedulersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
