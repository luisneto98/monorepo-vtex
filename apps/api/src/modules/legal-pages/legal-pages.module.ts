import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { LegalPagesController } from './legal-pages.controller';
import { LegalPagesService } from './legal-pages.service';
import { S3StorageService } from './services/s3-storage.service';
import { VirusScannerService } from './services/virus-scanner.service';
import { LegalPage, LegalPageSchema } from './schemas/legal-page.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LegalPage.name, schema: LegalPageSchema }]),
    MulterModule.register({
      storage: undefined, // Use memory storage for S3 upload
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [LegalPagesController],
  providers: [LegalPagesService, S3StorageService, VirusScannerService],
  exports: [LegalPagesService],
})
export class LegalPagesModule {}
