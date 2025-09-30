import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './services/storage.service';
import { StorageConfigService } from './services/storage-config.service';
import { VirusScannerService } from './services/virus-scanner.service';

@Module({
  imports: [ConfigModule],
  providers: [StorageService, StorageConfigService, VirusScannerService],
  exports: [StorageService],
})
export class StorageModule {}
