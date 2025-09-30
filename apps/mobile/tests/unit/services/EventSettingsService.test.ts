import { EventSettingsService } from '../../../src/services/EventSettingsService';
import { CacheService } from '../../../src/services/CacheService';
import apiService from '../../../src/services/api';
import { EventSettings } from '@monorepo-vtex/shared/types/event-settings';

// Mock dependencies
jest.mock('../../../src/services/CacheService');
jest.mock('../../../src/services/api');

const mockEventSettings: EventSettings = {
  _id: '123',
  eventName: {
    pt: 'Evento Teste',
    en: 'Test Event',
    es: 'Evento de Prueba',
  },
  startDate: '2025-09-25T10:00:00Z',
  endDate: '2025-09-27T18:00:00Z',
  venue: {
    name: 'Centro de Convenções',
    address: 'Rua Teste, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    complement: 'Sala 456',
  },
  contact: {
    email: 'contato@evento.com',
    phone: '+5511987654321',
    whatsapp: '+5511987654321',
  },
  socialMedia: {
    instagram: 'https://instagram.com/evento',
    facebook: 'https://facebook.com/evento',
    linkedin: 'https://linkedin.com/company/evento',
    twitter: 'https://twitter.com/evento',
    youtube: 'https://youtube.com/evento',
  },
  mapCoordinates: {
    latitude: -23.5505,
    longitude: -46.6333,
  },
};

describe('EventSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchEventSettings', () => {
    it('should return cached data if available and useCache is true', async () => {
      // Arrange
      (CacheService.get as jest.Mock).mockResolvedValue(mockEventSettings);
      (apiService.get as jest.Mock).mockResolvedValue(mockEventSettings); // For background refresh

      // Act
      const result = await EventSettingsService.fetchEventSettings(true);

      // Assert
      expect(result).toEqual(mockEventSettings);
      expect(CacheService.get).toHaveBeenCalledWith('@cache_event_settings');
      // Note: Background refresh may happen, but result is returned immediately from cache
    });

    it('should fetch from API if cache is empty', async () => {
      // Arrange
      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (apiService.get as jest.Mock).mockResolvedValue(mockEventSettings);
      (CacheService.set as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await EventSettingsService.fetchEventSettings(true);

      // Assert
      expect(result).toEqual(mockEventSettings);
      expect(apiService.get).toHaveBeenCalledWith('/api/event-settings');
      expect(CacheService.set).toHaveBeenCalledWith(
        '@cache_event_settings',
        mockEventSettings,
        24 * 60 * 60 * 1000
      );
    });

    it('should bypass cache if useCache is false', async () => {
      // Arrange
      (apiService.get as jest.Mock).mockResolvedValue(mockEventSettings);
      (CacheService.set as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await EventSettingsService.fetchEventSettings(false);

      // Assert
      expect(result).toEqual(mockEventSettings);
      expect(CacheService.get).not.toHaveBeenCalled();
      expect(apiService.get).toHaveBeenCalledWith('/api/event-settings');
    });

    it('should return stale cache on network error', async () => {
      // Arrange
      (CacheService.get as jest.Mock)
        .mockResolvedValueOnce(null) // First call returns null (cache miss)
        .mockResolvedValueOnce(mockEventSettings); // Second call returns stale cache
      (apiService.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await EventSettingsService.fetchEventSettings(true);

      // Assert
      expect(result).toEqual(mockEventSettings);
      expect(CacheService.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error if no cache and network fails', async () => {
      // Arrange
      (CacheService.get as jest.Mock).mockResolvedValue(null);
      const networkError = new Error('Network error');
      (networkError as any).message = 'Network request failed';
      (apiService.get as jest.Mock).mockRejectedValue(networkError);

      // Act & Assert
      await expect(EventSettingsService.fetchEventSettings(true)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle 404 error correctly', async () => {
      // Arrange
      (CacheService.get as jest.Mock).mockResolvedValue(null);
      const error: any = new Error('Not found');
      error.status = 404;
      (apiService.get as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(EventSettingsService.fetchEventSettings(true)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Event settings not found. Please contact support.',
      });
    });

    it('should handle 500 error correctly', async () => {
      // Arrange
      (CacheService.get as jest.Mock).mockResolvedValue(null);
      const error: any = new Error('Server error');
      error.status = 500;
      (apiService.get as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(EventSettingsService.fetchEventSettings(true)).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
      });
    });
  });

  describe('refreshEventSettings', () => {
    it('should clear cache and fetch fresh data', async () => {
      // Arrange
      (CacheService.invalidate as jest.Mock).mockResolvedValue(undefined);
      (apiService.get as jest.Mock).mockResolvedValue(mockEventSettings);
      (CacheService.set as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await EventSettingsService.refreshEventSettings();

      // Assert
      expect(result).toEqual(mockEventSettings);
      expect(CacheService.invalidate).toHaveBeenCalledWith('@cache_event_settings');
      expect(apiService.get).toHaveBeenCalledWith('/api/event-settings');
      expect(CacheService.set).toHaveBeenCalledWith(
        '@cache_event_settings',
        mockEventSettings,
        24 * 60 * 60 * 1000
      );
    });

    it('should throw error on network failure', async () => {
      // Arrange
      (CacheService.invalidate as jest.Mock).mockResolvedValue(undefined);
      const networkError = new Error('Network error');
      (networkError as any).message = 'Network request failed';
      (apiService.get as jest.Mock).mockRejectedValue(networkError);

      // Act & Assert
      await expect(EventSettingsService.refreshEventSettings()).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('hasCachedData', () => {
    it('should return true if cache is valid', async () => {
      // Arrange
      (CacheService.isValid as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await EventSettingsService.hasCachedData();

      // Assert
      expect(result).toBe(true);
      expect(CacheService.isValid).toHaveBeenCalledWith('@cache_event_settings');
    });

    it('should return false if cache is invalid', async () => {
      // Arrange
      (CacheService.isValid as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await EventSettingsService.hasCachedData();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear cache', async () => {
      // Arrange
      (CacheService.invalidate as jest.Mock).mockResolvedValue(undefined);

      // Act
      await EventSettingsService.clearCache();

      // Assert
      expect(CacheService.invalidate).toHaveBeenCalledWith('@cache_event_settings');
    });
  });

  describe('getLocalizedEventName', () => {
    it('should return Portuguese name for pt locale', () => {
      const result = EventSettingsService.getLocalizedEventName(mockEventSettings, 'pt');
      expect(result).toBe('Evento Teste');
    });

    it('should return English name for en locale', () => {
      const result = EventSettingsService.getLocalizedEventName(mockEventSettings, 'en');
      expect(result).toBe('Test Event');
    });

    it('should return Spanish name for es locale', () => {
      const result = EventSettingsService.getLocalizedEventName(mockEventSettings, 'es');
      expect(result).toBe('Evento de Prueba');
    });

    it('should fallback to Portuguese for unsupported locale', () => {
      const result = EventSettingsService.getLocalizedEventName(mockEventSettings, 'fr');
      expect(result).toBe('Evento Teste');
    });

    it('should extract language code from locale with region', () => {
      const result = EventSettingsService.getLocalizedEventName(mockEventSettings, 'en-US');
      expect(result).toBe('Test Event');
    });

    it('should fallback to Portuguese for undefined locale', () => {
      const result = EventSettingsService.getLocalizedEventName(mockEventSettings);
      expect(result).toBe('Evento Teste');
    });
  });

  describe('validateCoordinates', () => {
    it('should return true for valid coordinates', () => {
      const result = EventSettingsService.validateCoordinates({
        latitude: -23.5505,
        longitude: -46.6333,
      });
      expect(result).toBe(true);
    });

    it('should return false for latitude > 90', () => {
      const result = EventSettingsService.validateCoordinates({
        latitude: 91,
        longitude: 0,
      });
      expect(result).toBe(false);
    });

    it('should return false for latitude < -90', () => {
      const result = EventSettingsService.validateCoordinates({
        latitude: -91,
        longitude: 0,
      });
      expect(result).toBe(false);
    });

    it('should return false for longitude > 180', () => {
      const result = EventSettingsService.validateCoordinates({
        latitude: 0,
        longitude: 181,
      });
      expect(result).toBe(false);
    });

    it('should return false for longitude < -180', () => {
      const result = EventSettingsService.validateCoordinates({
        latitude: 0,
        longitude: -181,
      });
      expect(result).toBe(false);
    });

    it('should return false for NaN latitude', () => {
      const result = EventSettingsService.validateCoordinates({
        latitude: NaN,
        longitude: 0,
      });
      expect(result).toBe(false);
    });

    it('should return false for NaN longitude', () => {
      const result = EventSettingsService.validateCoordinates({
        latitude: 0,
        longitude: NaN,
      });
      expect(result).toBe(false);
    });

    it('should return true for edge case coordinates', () => {
      expect(
        EventSettingsService.validateCoordinates({ latitude: 90, longitude: 180 })
      ).toBe(true);
      expect(
        EventSettingsService.validateCoordinates({ latitude: -90, longitude: -180 })
      ).toBe(true);
      expect(
        EventSettingsService.validateCoordinates({ latitude: 0, longitude: 0 })
      ).toBe(true);
    });
  });
});