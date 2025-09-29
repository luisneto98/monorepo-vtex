import { Test, TestingModule } from '@nestjs/testing';
import { EventSettingsController } from './event-settings.controller';
import { EventSettingsService } from './event-settings.service';
import { UpdateEventSettingsDto } from './dto/update-event-settings.dto';

describe('EventSettingsController', () => {
  let controller: EventSettingsController;
  let service: EventSettingsService;

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
  };

  beforeEach(async () => {
    const mockService = {
      getSettings: jest.fn(),
      getPublicSettings: jest.fn(),
      updateSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventSettingsController],
      providers: [
        {
          provide: EventSettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EventSettingsController>(EventSettingsController);
    service = module.get<EventSettingsService>(EventSettingsService);
  });

  describe('getSettings', () => {
    it('should return event settings', async () => {
      jest.spyOn(service, 'getSettings').mockResolvedValue(mockEventSettings);

      const result = await controller.getSettings();

      expect(service.getSettings).toHaveBeenCalled();
      expect(result).toEqual(mockEventSettings);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      jest.spyOn(service, 'getSettings').mockRejectedValue(error);

      await expect(controller.getSettings()).rejects.toThrow(error);
    });
  });

  describe('updateSettings', () => {
    it('should update event settings', async () => {
      const updateDto: UpdateEventSettingsDto = {
        eventName: {
          pt: 'VTEX Day 2027',
          en: 'VTEX Day 2027',
          es: 'VTEX Day 2027',
        },
      };

      const mockRequest = {
        user: {
          userId: 'user123',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      };

      const updatedSettings = {
        ...mockEventSettings,
        eventName: updateDto.eventName || mockEventSettings.eventName,
      };
      jest.spyOn(service, 'updateSettings').mockResolvedValue(updatedSettings);

      const result = await controller.updateSettings(updateDto, mockRequest);

      expect(service.updateSettings).toHaveBeenCalledWith(updateDto, 'user123');
      expect(result).toEqual(updatedSettings);
    });

    it('should pass user ID to service', async () => {
      const updateDto: UpdateEventSettingsDto = {};
      const mockRequest = {
        user: {
          userId: 'admin456',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      };

      jest.spyOn(service, 'updateSettings').mockResolvedValue(mockEventSettings);

      await controller.updateSettings(updateDto, mockRequest);

      expect(service.updateSettings).toHaveBeenCalledWith(updateDto, 'admin456');
    });
  });

  describe('getPublicSettings', () => {
    it('should return public event settings', async () => {
      const publicSettings = { ...mockEventSettings, updatedBy: '' };
      jest.spyOn(service, 'getPublicSettings').mockResolvedValue(publicSettings);

      const result = await controller.getPublicSettings();

      expect(service.getPublicSettings).toHaveBeenCalled();
      expect(result).toEqual(publicSettings);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'getPublicSettings').mockRejectedValue(error);

      await expect(controller.getPublicSettings()).rejects.toThrow(error);
    });
  });
});
