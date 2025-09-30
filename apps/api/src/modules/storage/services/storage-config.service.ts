import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageConfigService {
  constructor(private configService: ConfigService) {}

  getAwsRegion(): string {
    return this.configService.get<string>('AWS_REGION', 'us-east-1');
  }

  getAwsBucket(): string {
    return this.configService.get<string>('AWS_S3_BUCKET', 'vtexday26-legal-docs');
  }

  getAwsAccessKeyId(): string {
    return this.configService.get<string>('AWS_ACCESS_KEY_ID', '');
  }

  getAwsSecretAccessKey(): string {
    return this.configService.get<string>('AWS_SECRET_ACCESS_KEY', '');
  }

  isVirusScanningEnabled(): boolean {
    return this.configService.get<boolean>('VIRUS_SCANNING_ENABLED', false);
  }

  getClamAvHost(): string | undefined {
    return this.configService.get<string>('CLAMAV_HOST');
  }

  getClamAvPort(): number {
    return this.configService.get<number>('CLAMAV_PORT', 3310);
  }
}
