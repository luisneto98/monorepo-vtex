import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';
import { SystemConfig, SystemConfigSchema } from './schemas/system-config.schema';
import { VisibilityAudit, VisibilityAuditSchema } from './schemas/visibility-audit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
      { name: VisibilityAudit.name, schema: VisibilityAuditSchema },
    ]),
    CacheModule.register({
      ttl: 60000, // 1 minute default TTL
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}