import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import { EventSettingsService } from './event-settings.service';
import { EventSettings } from './schemas/event-settings.schema';

describe('EventSettingsService', () => {
  let service: EventSettingsService;
  let mockModel: any;
  let mockCacheManager: any;

  const mockEventSettings = {
    _id: '123',
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
    updatedBy: 'user123',
    updatedAt: new Date(),
    toObject: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    mockModel = jest.fn().mockImplementation(function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue(mockEventSettings),
      };
    });

    mockModel.findOne = jest.fn();
    mockModel.findOneAndUpdate = jest.fn();

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventSettingsService,
        {
          provide: getModelToken(EventSettings.name),
          useValue: mockModel,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<EventSettingsService>(EventSettingsService);
  });

  describe('getSettings', () => {
    it('should return existing settings', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEventSettings),
      });

      const result = await service.getSettings();

      expect(mockModel.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockEventSettings);
    });

    it('should create default settings if none exist', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getSettings();

      expect(mockModel.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getPublicSettings', () => {
    it('should return cached settings if available', async () => {
      const cachedData = { ...mockEventSettings, updatedBy: '' };
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getPublicSettings();

      expect(mockCacheManager.get).toHaveBeenCalledWith('event-settings:public');
      expect(result).toEqual(cachedData);
    });

    it('should fetch and cache settings if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEventSettings),
      });

      const result = await service.getPublicSettings();

      expect(mockCacheManager.get).toHaveBeenCalledWith('event-settings:public');
      expect(mockModel.findOne).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(result.updatedBy).toBe('');
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const updateDto = {
        eventName: {
          pt: 'VTEX Day 2027',
          en: 'VTEX Day 2027',
          es: 'VTEX Day 2027',
        },
      };

      // Mock findOne for audit logging
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEventSettings),
      });

      mockModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEventSettings),
      });

      const result = await service.updateSettings(updateDto, 'user123');

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          ...updateDto,
          updatedBy: 'user123',
        }),
        expect.objectContaining({
          new: true,
          upsert: true,
          runValidators: true,
        }),
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('event-settings:public');
      expect(result).toEqual(mockEventSettings);
    });

    it('should throw error if end date is before start date', async () => {
      const updateDto = {
        startDate: '2026-06-03T09:00:00Z',
        endDate: '2026-06-01T18:00:00Z',
      };

      // Mock findOne for audit logging
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateSettings(updateDto, 'user123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if end date equals start date', async () => {
      const updateDto = {
        startDate: '2026-06-01T09:00:00Z',
        endDate: '2026-06-01T09:00:00Z',
      };

      // Mock findOne for audit logging
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateSettings(updateDto, 'user123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});