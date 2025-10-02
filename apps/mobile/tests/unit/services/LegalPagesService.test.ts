import { LegalPagesService } from '../../../src/services/LegalPagesService';
import { CacheService } from '../../../src/services/CacheService';
import apiService from '../../../src/services/api';
import { PublicLegalPage, SupportedLanguage, LegalPageType } from '@monorepo-vtex/shared/types/legal-pages';

// Mock dependencies
jest.mock('../../../src/services/api');
jest.mock('../../../src/services/CacheService');

const mockedApiService = apiService as jest.Mocked<typeof apiService>;
const mockedCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('LegalPagesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockLegalPage: PublicLegalPage = {
    slug: 'terms-of-use',
    type: LegalPageType.TERMS,
    title: {
      pt: 'Termos de Uso',
      en: 'Terms of Use',
      es: 'Términos de Uso',
    },
    availableLanguages: ['pt', 'en', 'es'],
  };

  const mockPages: PublicLegalPage[] = [
    mockLegalPage,
    {
      slug: 'privacy-policy',
      type: LegalPageType.PRIVACY,
      title: {
        pt: 'Política de Privacidade',
        en: 'Privacy Policy',
        es: 'Política de Privacidad',
      },
      availableLanguages: ['pt', 'en'],
    },
  ];

  describe('fetchPublicLegalPages', () => {
    it('should fetch pages from API when cache is empty', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedApiService.get.mockResolvedValue({
        data: { data: mockPages },
      } as any);

      const result = await LegalPagesService.fetchPublicLegalPages();

      expect(mockedApiService.get).toHaveBeenCalledWith('/legal-pages/public/list');
      expect(mockedCacheService.set).toHaveBeenCalledWith(
        '@cache_legal_pages',
        mockPages,
        900000 // 15 minutes TTL
      );
      expect(result).toEqual(mockPages);
    });

    it('should return cached pages when available', async () => {
      mockedCacheService.get.mockResolvedValue(mockPages);
      mockedApiService.get.mockResolvedValue({
        data: { data: mockPages },
      } as any);

      const result = await LegalPagesService.fetchPublicLegalPages(true);

      expect(result).toEqual(mockPages);
      // Background refresh may be triggered
    });

    it('should bypass cache when useCache is false', async () => {
      mockedCacheService.get.mockResolvedValue(mockPages);
      mockedApiService.get.mockResolvedValue({
        data: { data: mockPages },
      } as any);

      const result = await LegalPagesService.fetchPublicLegalPages(false);

      expect(mockedApiService.get).toHaveBeenCalledWith('/legal-pages/public/list');
      expect(result).toEqual(mockPages);
    });

    it('should handle direct array response format', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedApiService.get.mockResolvedValue({
        data: mockPages, // Direct array without nested data property
      } as any);

      const result = await LegalPagesService.fetchPublicLegalPages(false);

      expect(result).toEqual(mockPages);
    });

    it('should return stale cache on API error', async () => {
      mockedCacheService.get
        .mockResolvedValueOnce(null) // First call (initial check)
        .mockResolvedValueOnce(mockPages); // Second call (fallback)
      mockedApiService.get.mockRejectedValue(new Error('Network error'));

      const result = await LegalPagesService.fetchPublicLegalPages();

      expect(result).toEqual(mockPages);
    });

    it('should transform network errors correctly', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      const networkError = new Error('Network request failed');
      networkError.name = 'AbortError';
      mockedApiService.get.mockRejectedValue(networkError);

      await expect(LegalPagesService.fetchPublicLegalPages()).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.stringContaining('Network error'),
      });
    });

    it('should transform 404 errors correctly', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      const error404 = { status: 404, message: 'Not found' };
      mockedApiService.get.mockRejectedValue(error404);

      await expect(LegalPagesService.fetchPublicLegalPages()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('Legal document not found'),
      });
    });

    it('should transform 500 errors correctly', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      const error500 = { status: 500, message: 'Server error' };
      mockedApiService.get.mockRejectedValue(error500);

      await expect(LegalPagesService.fetchPublicLegalPages()).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        message: expect.stringContaining('Server error'),
      });
    });
  });

  describe('refreshLegalPages', () => {
    it('should clear cache and fetch fresh data', async () => {
      mockedApiService.get.mockResolvedValue({
        data: { data: mockPages },
      } as any);

      const result = await LegalPagesService.refreshLegalPages();

      expect(mockedCacheService.invalidate).toHaveBeenCalledWith('@cache_legal_pages');
      expect(mockedApiService.get).toHaveBeenCalledWith('/legal-pages/public/list');
      expect(mockedCacheService.set).toHaveBeenCalledWith(
        '@cache_legal_pages',
        mockPages,
        900000
      );
      expect(result).toEqual(mockPages);
    });

    it('should handle direct array response in refresh', async () => {
      mockedApiService.get.mockResolvedValue({
        data: mockPages, // Direct array
      } as any);

      const result = await LegalPagesService.refreshLegalPages();

      expect(result).toEqual(mockPages);
    });
  });

  describe('getSignedDownloadUrl', () => {
    const mockSignedUrlResponse = {
      url: 'https://s3.example.com/signed-url?token=abc123',
      expiresIn: 3600,
    };

    it('should fetch signed URL successfully', async () => {
      mockedApiService.get.mockResolvedValue({
        data: mockSignedUrlResponse,
      } as any);

      const result = await LegalPagesService.getSignedDownloadUrl(
        'terms-of-use',
        SupportedLanguage.PT
      );

      expect(mockedApiService.get).toHaveBeenCalledWith(
        '/legal-pages/public/terms-of-use/pt/url'
      );
      expect(result).toEqual(mockSignedUrlResponse);
    });

    it('should handle nested data response format', async () => {
      mockedApiService.get.mockResolvedValue({
        data: { data: mockSignedUrlResponse },
      } as any);

      const result = await LegalPagesService.getSignedDownloadUrl(
        'privacy-policy',
        SupportedLanguage.EN
      );

      expect(result).toEqual(mockSignedUrlResponse);
    });

    it('should throw error when URL is missing from response', async () => {
      mockedApiService.get.mockResolvedValue({
        data: { expiresIn: 3600 }, // Missing url property
      } as any);

      await expect(
        LegalPagesService.getSignedDownloadUrl('terms-of-use', SupportedLanguage.PT)
      ).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
      });
    });

    it('should transform API errors correctly', async () => {
      mockedApiService.get.mockRejectedValue({ status: 404 });

      await expect(
        LegalPagesService.getSignedDownloadUrl('invalid-slug', SupportedLanguage.PT)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('cache management', () => {
    it('should check if cached data is valid', async () => {
      mockedCacheService.isValid.mockResolvedValue(true);

      const result = await LegalPagesService.hasCachedData();

      expect(mockedCacheService.isValid).toHaveBeenCalledWith('@cache_legal_pages');
      expect(result).toBe(true);
    });

    it('should clear cache', async () => {
      mockedCacheService.invalidate.mockResolvedValue();

      await LegalPagesService.clearCache();

      expect(mockedCacheService.invalidate).toHaveBeenCalledWith('@cache_legal_pages');
    });
  });
});
