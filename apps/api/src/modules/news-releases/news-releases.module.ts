import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsReleasesController, PublicNewsController } from './news-releases.controller';
import { NewsReleasesService } from './news-releases.service';
import { NewsRelease, NewsReleaseSchema } from './schemas/news-release.schema';
import { NewsReleaseAuditLog, NewsReleaseAuditLogSchema } from './schemas/audit-log.schema';
import { ImageProcessingService } from './services/image-processing.service';
import { ContentSanitizationService } from './services/content-sanitization.service';
import { PublicationSchedulerService } from './services/publication-scheduler.service';
import { FeedGeneratorService } from './services/feed-generator.service';
import { AuditLogService } from './services/audit-log.service';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from '../../config/multer.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsRelease.name, schema: NewsReleaseSchema },
      { name: NewsReleaseAuditLog.name, schema: NewsReleaseAuditLogSchema },
    ]),
    MulterModule.register(multerConfig),
  ],
  controllers: [NewsReleasesController, PublicNewsController],
  providers: [
    NewsReleasesService,
    ImageProcessingService,
    ContentSanitizationService,
    PublicationSchedulerService,
    FeedGeneratorService,
    AuditLogService,
  ],
  exports: [NewsReleasesService],
})
export class NewsReleasesModule {}
