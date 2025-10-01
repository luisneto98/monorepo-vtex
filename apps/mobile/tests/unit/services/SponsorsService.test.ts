import { SponsorsService, TierGroupedSponsors } from '../../../src/services/SponsorsService';
import apiService from '../../../src/services/api';
import { CacheService } from '../../../src/services/CacheService';

jest.mock('../../../src/services/api');
jest.mock('../../../src/services/CacheService');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('SponsorsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSponsorsByTier', () => {
    const mockSponsorsData: TierGroupedSponsors[] = [
      {
        tier: {
          _id: 'tier1',
          name: 'Diamond',
          displayName: { 'pt-BR': 'Diamante', en: 'Diamond' },
          order: 1,
        },
        sponsors: [
          {
            _id: 'sponsor1',
            name: 'VTEX',
            slug: 'vtex',
            description: {
              'pt-BR': 'Plataforma de comércio digital',
              en: 'Digital commerce platform',
            },
            tier: 'tier1',
            orderInTier: 1,
            websiteUrl: 'https://vtex.com',
            contactEmail: 'contact@vtex.com',
            standLocation: 'A1',
            socialLinks: {
              linkedin: 'https://linkedin.com/company/vtex',
            },
            tags: ['technology', 'ecommerce'],
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          },
        ],
      },
    ];

    it('should fetch sponsors from API when cache is disabled', async () => {
      const mockResponse = { data: { data: mockSponsorsData } };
      mockApiService.get.mockResolvedValue(mockResponse);

      const result = await SponsorsService.fetchSponsorsByTier(false);

      expect(mockApiService.get).toHaveBeenCalledWith('/sponsors/public/grouped-by-tier');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        '@cache_sponsors_by_tier',
        mockSponsorsData,
        24 * 60 * 60 * 1000
      );
      expect(result).toEqual(mockSponsorsData);
    });

    it('should return cached data if available', async () => {
      mockCacheService.get.mockResolvedValue(mockSponsorsData);

      const result = await SponsorsService.fetchSponsorsByTier(true);

      expect(mockCacheService.get).toHaveBeenCalledWith('@cache_sponsors_by_tier');
      expect(result).toEqual(mockSponsorsData);
    });

    it('should fetch fresh data if cache is empty', async () => {
      const mockResponse = { data: { data: mockSponsorsData } };
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockResolvedValue(mockResponse);

      const result = await SponsorsService.fetchSponsorsByTier(true);

      expect(mockCacheService.get).toHaveBeenCalledWith('@cache_sponsors_by_tier');
      expect(mockApiService.get).toHaveBeenCalledWith('/sponsors/public/grouped-by-tier');
      expect(result).toEqual(mockSponsorsData);
    });

    it('should return stale cache on API error', async () => {
      mockCacheService.get
        .mockResolvedValueOnce(null) // First call returns no cache
        .mockResolvedValueOnce(mockSponsorsData); // Second call (error fallback) returns stale cache
      mockApiService.get.mockRejectedValue(new Error('Network error'));

      const result = await SponsorsService.fetchSponsorsByTier(true);

      expect(result).toEqual(mockSponsorsData);
    });

    it('should throw transformed error if no cache available', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockRejectedValue({
        status: 500,
        message: 'Server error',
      });

      await expect(SponsorsService.fetchSponsorsByTier(true)).rejects.toEqual({
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
      });
    });
  });

  describe('refreshSponsors', () => {
    it('should clear cache and fetch fresh data', async () => {
      const mockSponsorsData: TierGroupedSponsors[] = [];
      const mockResponse = { data: { data: mockSponsorsData } };
      mockApiService.get.mockResolvedValue(mockResponse);

      const result = await SponsorsService.refreshSponsors();

      expect(mockCacheService.invalidate).toHaveBeenCalledWith('@cache_sponsors_by_tier');
      expect(mockApiService.get).toHaveBeenCalledWith('/sponsors/public/grouped-by-tier');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        '@cache_sponsors_by_tier',
        mockSponsorsData,
        24 * 60 * 60 * 1000
      );
      expect(result).toEqual(mockSponsorsData);
    });

    it('should throw transformed error on refresh failure', async () => {
      mockApiService.get.mockRejectedValue({
        status: 404,
        message: 'Not found',
      });

      await expect(SponsorsService.refreshSponsors()).rejects.toEqual({
        message: 'Sponsors not found. Please try again later.',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('fetchSponsorById', () => {
    it('should fetch a single sponsor by ID from public endpoint', async () => {
      const mockSponsor = {
        _id: 'sponsor1',
        name: 'VTEX',
        slug: 'vtex',
        description: { 'pt-BR': 'Descrição', en: 'Description' },
        tier: 'tier1',
        orderInTier: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockResponse = { data: { data: mockSponsor } };
      mockApiService.get.mockResolvedValue(mockResponse);

      const result = await SponsorsService.fetchSponsorById('sponsor1');

      expect(mockApiService.get).toHaveBeenCalledWith('/sponsors/public/sponsor1');
      expect(result).toEqual(mockSponsor);
    });
  });

  describe('hasCachedData', () => {
    it('should return true if cache is valid', async () => {
      mockCacheService.isValid.mockResolvedValue(true);

      const result = await SponsorsService.hasCachedData();

      expect(mockCacheService.isValid).toHaveBeenCalledWith('@cache_sponsors_by_tier');
      expect(result).toBe(true);
    });

    it('should return false if cache is invalid', async () => {
      mockCacheService.isValid.mockResolvedValue(false);

      const result = await SponsorsService.hasCachedData();

      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should invalidate sponsors cache', async () => {
      await SponsorsService.clearCache();

      expect(mockCacheService.invalidate).toHaveBeenCalledWith('@cache_sponsors_by_tier');
    });
  });

  describe('getLocalizedDescription', () => {
    const mockSponsor = {
      _id: 'sponsor1',
      name: 'VTEX',
      slug: 'vtex',
      description: {
        'pt-BR': 'Descrição em português',
        en: 'English description',
      },
      tier: 'tier1',
      orderInTier: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return pt-BR description for pt locale', () => {
      const result = SponsorsService.getLocalizedDescription(mockSponsor, 'pt-BR');
      expect(result).toBe('Descrição em português');
    });

    it('should return en description for en locale', () => {
      const result = SponsorsService.getLocalizedDescription(mockSponsor, 'en');
      expect(result).toBe('English description');
    });

    it('should fallback to en for unsupported locale', () => {
      const result = SponsorsService.getLocalizedDescription(mockSponsor, 'fr');
      expect(result).toBe('English description');
    });

    it('should use pt-BR as default', () => {
      const result = SponsorsService.getLocalizedDescription(mockSponsor);
      expect(result).toBe('Descrição em português');
    });
  });

  describe('getLocalizedTierName', () => {
    const mockTierDisplayName = {
      'pt-BR': 'Diamante',
      en: 'Diamond',
    };

    it('should return pt-BR tier name for pt locale', () => {
      const result = SponsorsService.getLocalizedTierName(mockTierDisplayName, 'pt-BR');
      expect(result).toBe('Diamante');
    });

    it('should return en tier name for en locale', () => {
      const result = SponsorsService.getLocalizedTierName(mockTierDisplayName, 'en');
      expect(result).toBe('Diamond');
    });

    it('should fallback to en for unsupported locale', () => {
      const result = SponsorsService.getLocalizedTierName(mockTierDisplayName, 'es');
      expect(result).toBe('Diamond');
    });
  });

  describe('error transformation', () => {
    it('should transform 404 errors correctly', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockRejectedValue({ status: 404 });

      await expect(SponsorsService.fetchSponsorsByTier(false)).rejects.toEqual({
        message: 'Sponsors not found. Please try again later.',
        code: 'NOT_FOUND',
      });
    });

    it('should transform 500+ errors correctly', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockRejectedValue({ status: 503 });

      await expect(SponsorsService.fetchSponsorsByTier(false)).rejects.toEqual({
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
      });
    });

    it('should transform network errors correctly', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockRejectedValue(new Error('Network request failed'));

      await expect(SponsorsService.fetchSponsorsByTier(false)).rejects.toEqual({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      });
    });

    it('should transform unknown errors correctly', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockRejectedValue(new Error('Unknown error'));

      await expect(SponsorsService.fetchSponsorsByTier(false)).rejects.toEqual({
        message: 'Unknown error',
        code: 'UNKNOWN_ERROR',
      });
    });
  });
});
