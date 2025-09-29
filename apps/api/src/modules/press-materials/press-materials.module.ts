import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PressMaterialsController } from './press-materials.controller';
import { PressMaterialsService } from './press-materials.service';
import { FileUploadService } from './services/file-upload.service';
import { ThumbnailService } from './services/thumbnail.service';
import { DownloadTrackingService } from './services/download-tracking.service';
import { PressMaterial, PressMaterialSchema } from './schemas/press-material.schema';
import { DownloadLog, DownloadLogSchema } from './schemas/download-log.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PressMaterial.name, schema: PressMaterialSchema },
      { name: DownloadLog.name, schema: DownloadLogSchema },
    ]),
    AuthModule,
  ],
  controllers: [PressMaterialsController],
  providers: [PressMaterialsService, FileUploadService, ThumbnailService, DownloadTrackingService],
  exports: [PressMaterialsService],
})
export class PressMaterialsModule {}
