import { PressMaterialsService } from '../../../src/services/PressMaterialsService';
import { CacheService } from '../../../src/services/CacheService';
import apiService from '../../../src/services/api';
import { PressMaterial } from '@monorepo-vtex/shared/types/press-materials';

// Mock dependencies
jest.mock('../../../src/services/api');
jest.mock('../../../src/services/CacheService');

const mockedApiService = apiService as jest.Mocked<typeof apiService>;
const mockedCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('PressMaterialsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPressMaterial: PressMaterial = {
    _id: 'material-1',
    type: 'press_kit',
    title: {
      pt: 'Kit de Imprensa 2026',
      en: 'Press Kit 2026',
      es: 'Kit de Prensa 2026',
    },
    description: {
      pt: 'Kit completo de imprensa',
      en: 'Complete press kit',
      es: 'Kit completo de prensa',
    },
    fileUrl: 'https://example.com/press-kit.zip',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    metadata: {
      size: 5242880,
      format: 'zip',
    },
    tags: ['event', '2026'],
    status: 'published',
    accessLevel: 'public',
    downloadCount: 42,
    uploadedBy: 'admin-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15'),
  };

  const mockMaterials: PressMaterial[] = [
    mockPressMaterial,
    {
      ...mockPressMaterial,
      _id: 'material-2',
      type: 'photo',
      title: {
        pt: 'Foto do Evento',
        en: 'Event Photo',
        es: 'Foto del Evento',
      },
    },
  ];

  describe('fetchPublicPressMaterials', () => {
    it('should fetch materials from API when cache is empty', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedApiService.get.mockResolvedValue({
        data: { data: mockMaterials },
      } as any);

      const result = await PressMaterialsService.fetchPublicPressMaterials();

      expect(mockedApiService.get).toHaveBeenCalledWith('/press-materials/public');
      expect(mockedCacheService.set).toHaveBeenCalledWith(
        '@cache_press_materials',
        mockMaterials,
        600000 // 10 minutes TTL
      );
      expect(result).toEqual(mockMaterials);
    });

    it('should return cached materials when available', async () => {
      mockedCacheService.get.mockResolvedValue(mockMaterials);
      mockedApiService.get.mockResolvedValue({
        data: { data: mockMaterials },
      } as any);

      const result = await PressMaterialsService.fetchPublicPressMaterials(true);

      expect(result).toEqual(mockMaterials);
      // Note: Background refresh may be triggered, so API might be called
    });

    it('should bypass cache when useCache is false', async () => {
      mockedCacheService.get.mockResolvedValue(mockMaterials);
      mockedApiService.get.mockResolvedValue({
        data: { data: mockMaterials },
      } as any);

      const result = await PressMaterialsService.fetchPublicPressMaterials(false);

      expect(mockedApiService.get).toHaveBeenCalledWith('/press-materials/public');
      expect(result).toEqual(mockMaterials);
    });

    it('should return stale cache on API error', async () => {
      mockedCacheService.get
        .mockResolvedValueOnce(null) // First call (initial check)
        .mockResolvedValueOnce(mockMaterials); // Second call (fallback)
      mockedApiService.get.mockRejectedValue(new Error('Network error'));

      const result = await PressMaterialsService.fetchPublicPressMaterials();

      expect(result).toEqual(mockMaterials);
    });

    it('should throw error when API fails and no cache available', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedApiService.get.mockRejectedValue({
        status: 500,
        message: 'Server error',
      });

      await expect(
        PressMaterialsService.fetchPublicPressMaterials()
      ).rejects.toMatchObject({
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
      });
    });

    it('should handle 404 errors correctly', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedApiService.get.mockRejectedValue({
        status: 404,
        message: 'Not found',
      });

      await expect(
        PressMaterialsService.fetchPublicPressMaterials()
      ).rejects.toMatchObject({
        message: 'Press materials not found. Please try again later.',
        code: 'NOT_FOUND',
      });
    });

    it('should handle network errors correctly', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedApiService.get.mockRejectedValue({
        name: 'AbortError',
        message: 'Network request failed',
      });

      await expect(
        PressMaterialsService.fetchPublicPressMaterials()
      ).rejects.toMatchObject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('refreshPressMaterials', () => {
    it('should clear cache and fetch fresh data', async () => {
      mockedApiService.get.mockResolvedValue({
        data: { data: mockMaterials },
      } as any);

      const result = await PressMaterialsService.refreshPressMaterials();

      expect(mockedCacheService.invalidate).toHaveBeenCalledWith('@cache_press_materials');
      expect(mockedApiService.get).toHaveBeenCalledWith('/press-materials/public');
      expect(mockedCacheService.set).toHaveBeenCalledWith(
        '@cache_press_materials',
        mockMaterials,
        600000
      );
      expect(result).toEqual(mockMaterials);
    });
  });

  describe('trackDownload', () => {
    it('should call download endpoint and return URL', async () => {
      const downloadUrl = 'https://s3.amazonaws.com/signed-url';
      mockedApiService.get.mockResolvedValue({
        data: { url: downloadUrl },
      } as any);

      const result = await PressMaterialsService.trackDownload('material-1');

      expect(mockedApiService.get).toHaveBeenCalledWith('/press-materials/material-1/download');
      expect(result).toBe(downloadUrl);
    });

    it('should handle download tracking errors', async () => {
      mockedApiService.get.mockRejectedValue({
        status: 404,
        message: 'Material not found',
      });

      await expect(
        PressMaterialsService.trackDownload('invalid-id')
      ).rejects.toMatchObject({
        message: 'Press materials not found. Please try again later.',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('hasCachedData', () => {
    it('should check if cached data is valid', async () => {
      mockedCacheService.isValid.mockResolvedValue(true);

      const result = await PressMaterialsService.hasCachedData();

      expect(mockedCacheService.isValid).toHaveBeenCalledWith('@cache_press_materials');
      expect(result).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear cached data', async () => {
      await PressMaterialsService.clearCache();

      expect(mockedCacheService.invalidate).toHaveBeenCalledWith('@cache_press_materials');
    });
  });

  describe('getLocalizedString', () => {
    const localizedString = {
      pt: 'Texto em português',
      en: 'Text in English',
      es: 'Texto en español',
    };

    it('should return Portuguese for pt-BR locale', () => {
      const result = PressMaterialsService.getLocalizedString(localizedString, 'pt-BR');
      expect(result).toBe('Texto em português');
    });

    it('should return English for en locale', () => {
      const result = PressMaterialsService.getLocalizedString(localizedString, 'en');
      expect(result).toBe('Text in English');
    });

    it('should return Spanish for es locale', () => {
      const result = PressMaterialsService.getLocalizedString(localizedString, 'es');
      expect(result).toBe('Texto en español');
    });

    it('should fallback to Portuguese for unsupported locale', () => {
      const result = PressMaterialsService.getLocalizedString(localizedString, 'fr');
      expect(result).toBe('Texto em português');
    });

    it('should default to Portuguese when no locale provided', () => {
      const result = PressMaterialsService.getLocalizedString(localizedString);
      expect(result).toBe('Texto em português');
    });
  });

  describe('groupByType', () => {
    it('should group materials by type', () => {
      const materials: PressMaterial[] = [
        { ...mockPressMaterial, type: 'press_kit' },
        { ...mockPressMaterial, _id: 'material-2', type: 'photo' },
        { ...mockPressMaterial, _id: 'material-3', type: 'photo' },
        { ...mockPressMaterial, _id: 'material-4', type: 'video' },
      ];

      const result = PressMaterialsService.groupByType(materials);

      expect(result.size).toBe(3);
      expect(result.get('press_kit')).toHaveLength(1);
      expect(result.get('photo')).toHaveLength(2);
      expect(result.get('video')).toHaveLength(1);
    });

    it('should return empty map for empty array', () => {
      const result = PressMaterialsService.groupByType([]);
      expect(result.size).toBe(0);
    });

    it('should return empty map for undefined input', () => {
      const result = PressMaterialsService.groupByType(undefined as any);
      expect(result.size).toBe(0);
    });

    it('should return empty map for null input', () => {
      const result = PressMaterialsService.groupByType(null as any);
      expect(result.size).toBe(0);
    });
  });

  describe('filterByType', () => {
    const materials: PressMaterial[] = [
      { ...mockPressMaterial, type: 'press_kit' },
      { ...mockPressMaterial, _id: 'material-2', type: 'photo' },
      { ...mockPressMaterial, _id: 'material-3', type: 'video' },
    ];

    it('should return all materials when filter is "all"', () => {
      const result = PressMaterialsService.filterByType(materials, 'all');
      expect(result).toHaveLength(3);
    });

    it('should filter materials by specific type', () => {
      const result = PressMaterialsService.filterByType(materials, 'photo');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('photo');
    });

    it('should return empty array when no materials match type', () => {
      const result = PressMaterialsService.filterByType(materials, 'logo_package');
      expect(result).toHaveLength(0);
    });

    it('should return empty array for undefined input', () => {
      const result = PressMaterialsService.filterByType(undefined as any, 'photo');
      expect(result).toHaveLength(0);
    });

    it('should return empty array for null input', () => {
      const result = PressMaterialsService.filterByType(null as any, 'all');
      expect(result).toHaveLength(0);
    });
  });
});
