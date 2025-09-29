import SearchService from '../SearchService';
import FaqService from '../FaqService';
import apiService from '../api';

jest.mock('../FaqService');
jest.mock('../api');

const mockFaqService = FaqService as jest.Mocked<typeof FaqService>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPaginatedResponse = {
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

  describe('searchFAQs', () => {
    it('should search FAQs using FaqService', async () => {
      mockFaqService.getFAQs.mockResolvedValue(mockPaginatedResponse);

      await SearchService.searchFAQs('test query', 1, 20);

      expect(mockFaqService.getFAQs).toHaveBeenCalledWith({
        search: 'test query',
        page: 1,
        limit: 20,
        isVisible: true,
      });
    });
  });

  describe('searchSessions', () => {
    it('should search sessions using apiService', async () => {
      mockApiService.getPaginated.mockResolvedValue(mockPaginatedResponse);

      await SearchService.searchSessions('test query', 1, 20);

      expect(mockApiService.getPaginated).toHaveBeenCalledWith('/sessions', 1, 20, {
        search: 'test query',
      });
    });
  });

  describe('searchSpeakers', () => {
    it('should search speakers using apiService', async () => {
      mockApiService.getPaginated.mockResolvedValue(mockPaginatedResponse);

      await SearchService.searchSpeakers('test query', 1, 20);

      expect(mockApiService.getPaginated).toHaveBeenCalledWith('/speakers', 1, 20, {
        search: 'test query',
      });
    });
  });

  describe('searchByContext', () => {
    it('should search FAQs when context is faq', async () => {
      mockFaqService.getFAQs.mockResolvedValue(mockPaginatedResponse);

      const result = await SearchService.searchByContext('faq', 'test', 1, 20);

      expect(result.type).toBe('faq');
      expect(mockFaqService.getFAQs).toHaveBeenCalled();
    });

    it('should search sessions when context is sessions', async () => {
      mockApiService.getPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await SearchService.searchByContext('sessions', 'test', 1, 20);

      expect(result.type).toBe('sessions');
      expect(mockApiService.getPaginated).toHaveBeenCalledWith('/sessions', 1, 20, {
        search: 'test',
      });
    });

    it('should search speakers when context is speakers', async () => {
      mockApiService.getPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await SearchService.searchByContext('speakers', 'test', 1, 20);

      expect(result.type).toBe('speakers');
      expect(mockApiService.getPaginated).toHaveBeenCalledWith('/speakers', 1, 20, {
        search: 'test',
      });
    });

    it('should throw error for unknown context', async () => {
      await expect(
        SearchService.searchByContext('unknown' as any, 'test', 1, 20)
      ).rejects.toThrow('Unknown search context: unknown');
    });
  });
});