import FaqService from '../FaqService';
import apiService from '../api';

jest.mock('../api');

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('FaqService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FaqService.clearCache();
  });

  describe('getFAQs', () => {
    it('should fetch FAQs with default params', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            _id: '1',
            question: { 'pt-BR': 'Pergunta 1', en: 'Question 1' },
            answer: { 'pt-BR': 'Resposta 1', en: 'Answer 1' },
            category: 'cat1',
            order: 1,
            viewCount: 10,
            isVisible: true,
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          limit: 20,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      const result = await FaqService.getFAQs();

      expect(mockApiService.getPaginated).toHaveBeenCalledWith('/faq', 1, 20, {
        page: 1,
        limit: 20,
        isVisible: true,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch FAQs with search and category filters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 20,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      await FaqService.getFAQs({
        search: 'test query',
        category: 'cat1',
        lang: 'pt-BR',
      });

      expect(mockApiService.getPaginated).toHaveBeenCalledWith('/faq', 1, 20, {
        page: 1,
        limit: 20,
        isVisible: true,
        search: 'test query',
        category: 'cat1',
        lang: 'pt-BR',
      });
    });

    it('should cache FAQs results', async () => {
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 20,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      // First call
      await FaqService.getFAQs({ search: 'cache test' });
      // Second call with same params
      await FaqService.getFAQs({ search: 'cache test' });

      // Should only call API once due to caching
      expect(mockApiService.getPaginated).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPopularFAQs', () => {
    it('should fetch popular FAQs', async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      mockApiService.get.mockResolvedValue(mockResponse);

      const result = await FaqService.getPopularFAQs(5, 'pt-BR');

      expect(mockApiService.get).toHaveBeenCalledWith('/faq/popular', {
        limit: 5,
        lang: 'pt-BR',
      });
      expect(result).toEqual({ data: [] });
    });
  });

  describe('getFAQCategories', () => {
    it('should fetch FAQ categories', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            _id: 'cat1',
            name: { 'pt-BR': 'Categoria 1', en: 'Category 1' },
            order: 1,
            faqCount: 5,
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          limit: 100,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      const result = await FaqService.getFAQCategories();

      expect(mockApiService.getPaginated).toHaveBeenCalledWith('/faq/categories', 1, 100);
      expect(result).toEqual(mockResponse);
    });

    it('should cache categories', async () => {
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 100,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      await FaqService.getFAQCategories();
      await FaqService.getFAQCategories();

      expect(mockApiService.getPaginated).toHaveBeenCalledTimes(1);
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      mockApiService.post.mockResolvedValue({ success: true });

      await FaqService.incrementViewCount('faq123');

      expect(mockApiService.post).toHaveBeenCalledWith('/faq/faq123/view', {});
    });

    it('should not throw error on failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiService.post.mockRejectedValue(new Error('Network error'));

      await expect(FaqService.incrementViewCount('faq123')).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('clearCache', () => {
    it('should clear cache', async () => {
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 20,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      // First call
      await FaqService.getFAQs({ search: 'test' });

      FaqService.clearCache();

      // Second call after clearing cache
      await FaqService.getFAQs({ search: 'test' });

      // Should call API twice since cache was cleared
      expect(mockApiService.getPaginated).toHaveBeenCalledTimes(2);
    });
  });
});