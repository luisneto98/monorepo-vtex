import { NewsReleasesService } from '../../../src/services/NewsReleasesService';
import apiService from '../../../src/services/api';
import { CacheService } from '../../../src/services/CacheService';
import { NewsRelease, NewsReleaseFilter } from '@vtexday26/shared/types/news-releases';

// Mock dependencies
jest.mock('../../../src/services/api');
jest.mock('../../../src/services/CacheService');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('NewsReleasesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockNewsRelease: NewsRelease = {
    _id: '1',
    slug: 'test-article',
    content: {
      'pt-BR': {
        title: 'Título do Artigo',
        subtitle: 'Subtítulo do Artigo',
        content: '<p>Conteúdo do artigo em HTML</p>',
      },
      en: {
        title: 'Article Title',
        subtitle: 'Article Subtitle',
        content: '<p>Article content in HTML</p>',
      },
      es: {
        title: 'Título del Artículo',
        subtitle: 'Subtítulo del Artículo',
        content: '<p>Contenido del artículo en HTML</p>',
      },
    },
    status: 'published',
    featured: false,
    featuredImage: 'https://example.com/image.jpg',
    images: [],
    categories: ['Technology', 'Innovation'],
    tags: ['vtex', 'tech'],
    author: {
      id: 'author1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    publishedAt: new Date('2025-01-15'),
    viewCount: 100,
    relatedArticles: [],
    isDeleted: false,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-15'),
    version: 1,
  };

  describe('getPublicNews', () => {
    it('should fetch news articles successfully from API', async () => {
      const mockResponse = {
        data: {
          statusCode: 200,
          message: 'Success',
          data: {
            items: [mockNewsRelease],
            total: 1,
            page: 1,
            pages: 1,
          },
          timestamp: new Date().toISOString(),
        },
      };

      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockResolvedValue(mockResponse);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await NewsReleasesService.getPublicNews({});

      expect(mockApiService.get).toHaveBeenCalledWith('/public/news', {
        params: {},
      });
      expect(result.data).toEqual([mockNewsRelease]);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pages).toBe(1);
    });

    it('should return cached data when available', async () => {
      const cachedResponse = {
        data: [mockNewsRelease],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };

      mockCacheService.get.mockResolvedValue(cachedResponse);
      mockApiService.get.mockResolvedValue({ data: cachedResponse });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await NewsReleasesService.getPublicNews({}, true);

      expect(mockCacheService.get).toHaveBeenCalled();
      // Note: Background refresh is triggered, so API is called asynchronously
      expect(result).toEqual(cachedResponse);
    });

    it('should apply filters correctly', async () => {
      const filters: NewsReleaseFilter = {
        page: 2,
        limit: 20,
        language: 'en',
        categories: ['Technology'],
        search: 'vtex',
      };

      const mockResponse = {
        data: {
          statusCode: 200,
          message: 'Success',
          data: {
            items: [],
            total: 0,
            page: 2,
            pages: 0,
          },
          timestamp: new Date().toISOString(),
        },
      };

      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockResolvedValue(mockResponse);
      mockCacheService.set.mockResolvedValue(undefined);

      await NewsReleasesService.getPublicNews(filters, false);

      expect(mockApiService.get).toHaveBeenCalledWith('/public/news', {
        params: {
          page: 2,
          limit: 20,
          language: 'en',
          category: 'Technology',
          search: 'vtex',
        },
      });
    });

    it('should return stale cache on error', async () => {
      const cachedResponse = {
        data: [mockNewsRelease],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };

      mockCacheService.get.mockResolvedValueOnce(null); // First call returns null
      mockApiService.get.mockRejectedValue(new Error('Network error'));
      mockCacheService.get.mockResolvedValueOnce(cachedResponse); // Second call returns cache

      const result = await NewsReleasesService.getPublicNews({});

      expect(result).toEqual(cachedResponse);
    });
  });

  describe('getFeaturedNews', () => {
    it('should fetch featured articles successfully', async () => {
      const mockResponse = {
        data: {
          statusCode: 200,
          message: 'Success',
          data: {
            items: [{ ...mockNewsRelease, featured: true }],
          },
          timestamp: new Date().toISOString(),
        },
      };

      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockResolvedValue(mockResponse);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await NewsReleasesService.getFeaturedNews(false);

      expect(mockApiService.get).toHaveBeenCalledWith('/public/news/featured');
      expect(result).toEqual([{ ...mockNewsRelease, featured: true }]);
    });
  });

  describe('getNewsBySlug', () => {
    it('should fetch article by slug successfully', async () => {
      const mockResponse = {
        data: {
          statusCode: 200,
          message: 'Success',
          data: mockNewsRelease,
          timestamp: new Date().toISOString(),
        },
      };

      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockResolvedValue(mockResponse);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await NewsReleasesService.getNewsBySlug('test-article', false);

      expect(mockApiService.get).toHaveBeenCalledWith('/public/news/test-article');
      expect(result).toEqual(mockNewsRelease);
    });

    it('should cache article permanently', async () => {
      const mockResponse = {
        data: {
          statusCode: 200,
          message: 'Success',
          data: mockNewsRelease,
          timestamp: new Date().toISOString(),
        },
      };

      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockResolvedValue(mockResponse);
      mockCacheService.set.mockResolvedValue(undefined);

      await NewsReleasesService.getNewsBySlug('test-article', false);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('test-article'),
        mockNewsRelease,
        -1 // Permanent cache
      );
    });
  });

  describe('refreshNews', () => {
    it('should clear cache and fetch fresh data', async () => {
      const mockResponse = {
        data: {
          statusCode: 200,
          message: 'Success',
          data: {
            items: [mockNewsRelease],
            total: 1,
            page: 1,
            pages: 1,
          },
          timestamp: new Date().toISOString(),
        },
      };

      mockCacheService.invalidate.mockResolvedValue(undefined);
      mockApiService.get.mockResolvedValue(mockResponse);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await NewsReleasesService.refreshNews({});

      expect(mockCacheService.invalidate).toHaveBeenCalled();
      expect(mockApiService.get).toHaveBeenCalledWith('/public/news', {
        params: {},
      });
      expect(result.data).toEqual([mockNewsRelease]);
    });
  });

  describe('getLocalizedContent', () => {
    it('should return pt-BR content for Portuguese locale', () => {
      const result = NewsReleasesService.getLocalizedContent(mockNewsRelease, 'pt-BR');

      expect(result.title).toBe('Título do Artigo');
      expect(result.subtitle).toBe('Subtítulo do Artigo');
    });

    it('should return English content for English locale', () => {
      const result = NewsReleasesService.getLocalizedContent(mockNewsRelease, 'en-US');

      expect(result.title).toBe('Article Title');
      expect(result.subtitle).toBe('Article Subtitle');
    });

    it('should return Spanish content for Spanish locale', () => {
      const result = NewsReleasesService.getLocalizedContent(mockNewsRelease, 'es-ES');

      expect(result.title).toBe('Título del Artículo');
      expect(result.subtitle).toBe('Subtítulo del Artículo');
    });

    it('should fallback to pt-BR for unsupported locale', () => {
      const result = NewsReleasesService.getLocalizedContent(mockNewsRelease, 'fr-FR');

      expect(result.title).toBe('Título do Artigo');
    });
  });

  describe('error handling', () => {
    it('should transform 404 errors correctly', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockRejectedValue({ status: 404 });

      await expect(NewsReleasesService.getPublicNews({})).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('not found'),
      });
    });

    it('should transform 500 errors correctly', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockRejectedValue({ status: 500 });

      await expect(NewsReleasesService.getPublicNews({})).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        message: expect.stringContaining('Server error'),
      });
    });

    it('should transform network errors correctly', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockApiService.get.mockRejectedValue({
        name: 'AbortError',
        message: 'Network request failed',
      });

      await expect(NewsReleasesService.getPublicNews({})).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.stringContaining('Network error'),
      });
    });
  });
});
