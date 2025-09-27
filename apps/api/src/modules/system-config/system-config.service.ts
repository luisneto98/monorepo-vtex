import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SystemConfig, SystemConfigDocument } from './schemas/system-config.schema';
import { VisibilityAudit, VisibilityAuditDocument } from './schemas/visibility-audit.schema';
import { UpdateSystemConfigDto } from './dto/update-config.dto';
import { UpdateSectionVisibilityDto } from './dto/section-visibility.dto';
import type { SectionName } from '@vtexday26/shared';

@Injectable()
export class SystemConfigService {
  private readonly CACHE_KEY = 'system-config';
  private readonly CACHE_TTL = 60000; // 1 minute in milliseconds

  constructor(
    @InjectModel(SystemConfig.name)
    private systemConfigModel: Model<SystemConfigDocument>,
    @InjectModel(VisibilityAudit.name)
    private visibilityAuditModel: Model<VisibilityAuditDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getConfig(): Promise<SystemConfig> {
    // Try to get from cache first
    const cached = await this.cacheManager.get<SystemConfig>(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Get from database
    const config = await this.systemConfigModel.findOne().exec();

    // If no config exists, create default one
    if (!config) {
      const newConfig = await this.createDefaultConfig();
      // Cache the result
      await this.cacheManager.set(this.CACHE_KEY, newConfig, this.CACHE_TTL);
      return newConfig.toObject() as SystemConfig;
    }

    // Cache the result
    await this.cacheManager.set(this.CACHE_KEY, config, this.CACHE_TTL);

    return config.toObject() as SystemConfig;
  }

  async getSectionVisibility(section: SectionName): Promise<any> {
    const config = await this.getConfig();
    return config.sections[section];
  }

  async updateConfig(
    updateDto: UpdateSystemConfigDto,
    userId: string,
    ipAddress?: string,
  ): Promise<SystemConfig> {
    const config = await this.systemConfigModel.findOne().exec();

    if (!config) {
      throw new NotFoundException('System configuration not found');
    }

    // Version check for optimistic locking
    if (updateDto.version && config.version !== updateDto.version) {
      throw new ConflictException('Configuration has been modified by another user');
    }

    // Process section updates and create audit logs
    if (updateDto.sections) {
      for (const [section, sectionUpdate] of Object.entries(updateDto.sections)) {
        if (sectionUpdate) {
          const previousState = config.sections[section as SectionName];
          const newState: any = {
            ...previousState,
            ...sectionUpdate,
            lastChanged: new Date(),
            changedBy: userId,
          };

          // Convert scheduled activation date if present
          if (sectionUpdate.scheduledActivation) {
            newState.scheduledActivation = {
              dateTime: new Date(sectionUpdate.scheduledActivation.dateTime),
              timezone: sectionUpdate.scheduledActivation.timezone,
            };
          }

          // Create audit log entry
          await this.createAuditLog(
            config._id.toString(),
            section,
            previousState,
            newState,
            userId,
            sectionUpdate.changeReason,
            ipAddress,
          );

          // Update the section
          config.sections[section as SectionName] = newState;
        }
      }
    }

    // Update metadata
    config.lastModifiedBy = userId;
    config.version = config.version + 1;

    // Save changes
    const updatedConfig = await config.save();

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY);

    return updatedConfig;
  }

  async updateSection(
    section: SectionName,
    updateDto: UpdateSectionVisibilityDto,
    userId: string,
    ipAddress?: string,
  ): Promise<SystemConfig> {
    const config = await this.systemConfigModel.findOne().exec();

    if (!config) {
      throw new NotFoundException('System configuration not found');
    }

    const previousState = config.sections[section];
    const newState: any = {
      ...previousState,
      ...updateDto,
      lastChanged: new Date(),
      changedBy: userId,
    };

    // Convert scheduled activation date if present
    if (updateDto.scheduledActivation) {
      newState.scheduledActivation = {
        dateTime: new Date(updateDto.scheduledActivation.dateTime),
        timezone: updateDto.scheduledActivation.timezone,
      };
    }

    // Create audit log entry
    await this.createAuditLog(
      config._id.toString(),
      section,
      previousState,
      newState,
      userId,
      updateDto.changeReason,
      ipAddress,
    );

    // Update the section
    config.sections[section] = newState;
    config.lastModifiedBy = userId;
    config.version = config.version + 1;

    // Save changes
    const updatedConfig = await config.save();

    // Invalidate cache
    await this.cacheManager.del(this.CACHE_KEY);

    return updatedConfig;
  }

  async getAuditLogs(
    page = 1,
    limit = 20,
    section?: string,
  ): Promise<{
    data: VisibilityAudit[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = section ? { section } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.visibilityAuditModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.visibilityAuditModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getScheduledChanges(): Promise<any[]> {
    const config = await this.getConfig();
    const scheduledChanges = [];

    for (const [section, visibility] of Object.entries(config.sections)) {
      if (visibility.scheduledActivation) {
        const scheduledTime = new Date(visibility.scheduledActivation.dateTime);
        if (scheduledTime > new Date()) {
          scheduledChanges.push({
            section,
            scheduledTime: visibility.scheduledActivation.dateTime,
            timezone: visibility.scheduledActivation.timezone,
            willBeVisible: !visibility.isVisible,
          });
        }
      }
    }

    return scheduledChanges;
  }

  async applyScheduledChanges(): Promise<void> {
    const config = await this.systemConfigModel.findOne().exec();
    if (!config) return;

    const now = new Date();
    let hasChanges = false;

    for (const [section, visibility] of Object.entries(config.sections)) {
      if (visibility.scheduledActivation) {
        const scheduledTime = new Date(visibility.scheduledActivation.dateTime);
        if (scheduledTime <= now) {
          // Apply the scheduled change
          visibility.isVisible = !visibility.isVisible;
          visibility.scheduledActivation = undefined;
          visibility.lastChanged = now;
          visibility.changedBy = 'system-scheduler';

          // Create audit log
          await this.createAuditLog(
            config._id.toString(),
            section,
            { ...visibility, isVisible: !visibility.isVisible },
            visibility,
            'system-scheduler',
            'Scheduled activation triggered',
          );

          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      config.lastModifiedBy = 'system-scheduler';
      config.version = config.version + 1;
      await config.save();

      // Invalidate cache
      await this.cacheManager.del(this.CACHE_KEY);
    }
  }

  private async createDefaultConfig(): Promise<SystemConfigDocument> {
    const defaultSection = {
      isVisible: true,
      lastChanged: new Date(),
      changedBy: 'system',
    };

    const config = new this.systemConfigModel({
      sections: {
        speakers: { ...defaultSection },
        sponsors: { ...defaultSection },
        sessions: { ...defaultSection },
        faq: { ...defaultSection },
        registration: { ...defaultSection },
        schedule: { ...defaultSection },
      },
      lastModifiedBy: 'system',
      version: 1,
    });

    return config.save();
  }

  private async createAuditLog(
    configId: string,
    section: string,
    previousState: any,
    newState: any,
    changedBy: string,
    changeReason?: string,
    ipAddress?: string,
  ): Promise<VisibilityAuditDocument> {
    const auditLog = new this.visibilityAuditModel({
      configId,
      section,
      previousState,
      newState,
      changedBy,
      changeReason,
      ipAddress,
    });

    return auditLog.save();
  }

  async cleanupAuditLogs(cutoffDate: Date): Promise<number> {
    const result = await this.visibilityAuditModel.deleteMany({
      createdAt: { $lt: cutoffDate }
    }).exec();

    return result.deletedCount || 0;
  }
}