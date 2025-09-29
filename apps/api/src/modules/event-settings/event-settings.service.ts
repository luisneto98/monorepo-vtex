import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventSettings, EventSettingsDocument } from './schemas/event-settings.schema';
import { UpdateEventSettingsDto } from './dto/update-event-settings.dto';
import { IEventSettings } from './interfaces/event-settings.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class EventSettingsService {
  private readonly logger = new Logger(EventSettingsService.name);
  private readonly CACHE_KEY = 'event-settings:public';
  private readonly CACHE_TTL = 300000; // 5 minutes in milliseconds

  constructor(
    @InjectModel(EventSettings.name)
    private eventSettingsModel: Model<EventSettingsDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getSettings(): Promise<IEventSettings> {
    try {
      let settings = await this.eventSettingsModel.findOne().exec();

      if (!settings) {
        // Create default settings if none exist
        settings = await this.createDefaultSettings();
      }

      return settings.toObject() as IEventSettings;
    } catch (error) {
      this.logger.error('Error getting event settings', error);
      throw error;
    }
  }

  async getPublicSettings(): Promise<IEventSettings> {
    try {
      // Check cache first
      const cached = await this.cacheManager.get<IEventSettings>(this.CACHE_KEY);
      if (cached) {
        return cached;
      }

      const settings = await this.getSettings();

      // Sanitize data for public consumption
      const publicSettings: IEventSettings = {
        eventName: settings.eventName,
        startDate: settings.startDate,
        endDate: settings.endDate,
        venue: settings.venue,
        contact: {
          email: settings.contact.email,
          phone: settings.contact.phone,
          whatsapp: settings.contact.whatsapp,
        },
        socialMedia: settings.socialMedia,
        mapCoordinates: settings.mapCoordinates,
        updatedBy: '', // Don't expose who updated
      };

      // Cache the result
      await this.cacheManager.set(this.CACHE_KEY, publicSettings, this.CACHE_TTL);

      return publicSettings;
    } catch (error) {
      this.logger.error('Error getting public event settings', error);
      throw error;
    }
  }

  async updateSettings(updateDto: UpdateEventSettingsDto, userId: string): Promise<IEventSettings> {
    try {
      // Get previous settings for audit comparison
      const previousSettings = await this.eventSettingsModel.findOne().exec();

      // Validate dates if both are provided
      if (updateDto.startDate && updateDto.endDate) {
        const startDate = new Date(updateDto.startDate);
        const endDate = new Date(updateDto.endDate);

        if (endDate <= startDate) {
          throw new BadRequestException('End date must be after start date');
        }
      }

      // Use findOneAndUpdate with upsert to ensure singleton pattern
      const settings = await this.eventSettingsModel
        .findOneAndUpdate(
          {},
          {
            ...updateDto,
            updatedBy: userId,
            updatedAt: new Date(),
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          },
        )
        .exec();

      // Clear cache when settings are updated
      await this.cacheManager.del(this.CACHE_KEY);

      // Enhanced audit logging
      const auditLog = {
        action: previousSettings ? 'UPDATE' : 'CREATE',
        entityType: 'EventSettings',
        entityId: settings._id,
        userId,
        timestamp: new Date().toISOString(),
        changes: this.getChangedFields(previousSettings, settings),
        ipAddress: 'Not captured - consider adding from request context',
      };

      this.logger.log('Event Settings Audit Log:', auditLog);

      // Log specific important changes
      if (updateDto.startDate || updateDto.endDate) {
        this.logger.warn(
          `Event dates changed by user ${userId}: Start: ${updateDto.startDate}, End: ${updateDto.endDate}`,
        );
      }

      if (updateDto.venue) {
        this.logger.warn(
          `Event venue changed by user ${userId}: ${JSON.stringify(updateDto.venue)}`,
        );
      }

      return settings.toObject() as IEventSettings;
    } catch (error) {
      this.logger.error('Error updating event settings', error);
      throw error;
    }
  }

  private getChangedFields(oldDoc: any, newDoc: any): Record<string, any> {
    const changes: Record<string, any> = {};

    if (!oldDoc) {
      return { allFields: 'Initial creation' };
    }

    const fieldsToCheck = [
      'eventName',
      'startDate',
      'endDate',
      'venue',
      'contact',
      'socialMedia',
      'mapCoordinates',
    ];

    for (const field of fieldsToCheck) {
      if (JSON.stringify(oldDoc[field]) !== JSON.stringify(newDoc[field])) {
        changes[field] = {
          old: oldDoc[field],
          new: newDoc[field],
        };
      }
    }

    return changes;
  }

  private async createDefaultSettings(): Promise<any> {
    const defaultSettings = new this.eventSettingsModel({
      eventName: {
        pt: 'VTEX Day 2026',
        en: 'VTEX Day 2026',
        es: 'VTEX Day 2026',
      },
      startDate: new Date('2026-06-01T09:00:00Z'),
      endDate: new Date('2026-06-03T18:00:00Z'),
      venue: {
        name: 'São Paulo Expo',
        address: 'Rodovia dos Imigrantes, km 1,5',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04329-100',
        complement: 'Água Funda',
      },
      contact: {
        email: 'contato@vtexday.com.br',
        phone: '+55 11 9999-9999',
        whatsapp: '+55 11 9999-9999',
      },
      socialMedia: {
        instagram: 'https://instagram.com/vtexday',
        facebook: 'https://facebook.com/vtexday',
        linkedin: 'https://linkedin.com/company/vtexday',
        twitter: 'https://twitter.com/vtexday',
        youtube: 'https://youtube.com/vtexday',
      },
      mapCoordinates: {
        latitude: -23.6283,
        longitude: -46.6409,
      },
      updatedBy: 'system',
    });

    return await defaultSettings.save();
  }
}
