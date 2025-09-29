import HomeService from '../../../src/services/HomeService';
import apiService from '../../../src/services/api';

// Mock the API service
jest.mock('../../../src/services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('HomeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchHomeData', () => {
    it('should fetch all home data successfully', async () => {
      const mockHighlightSessions = {
        success: true,
        data: [
          {
            _id: '1',
            title: { 'pt-BR': 'Session 1', en: 'Session 1' },
            description: { 'pt-BR': 'Description 1', en: 'Description 1' },
            startTime: new Date('2024-01-01T10:00:00Z'),
            endTime: new Date('2024-01-01T11:00:00Z'),
            stage: 'principal',
            speakerIds: ['speaker1'],
            tags: ['tech'],
            isHighlight: true,
            isVisible: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          limit: 3,
          hasNext: false,
          hasPrev: false,
        },
      };

      const mockHighlightSpeakers = {
        success: true,
        data: [
          {
            _id: 'speaker1',
            name: 'John Doe',
            bio: { 'pt-BR': 'Bio em português', en: 'Bio in English' },
            photoUrl: 'https://example.com/photo.jpg',
            company: 'VTEX',
            position: { 'pt-BR': 'Desenvolvedor', en: 'Developer' },
            socialLinks: {},
            priority: 1,
            isHighlight: true,
            isVisible: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          limit: 4,
          hasNext: false,
          hasPrev: false,
        },
      };

      const mockUpcomingSessions = {
        success: true,
        data: [
          {
            _id: '2',
            title: { 'pt-BR': 'Upcoming Session', en: 'Upcoming Session' },
            description: { 'pt-BR': 'Description', en: 'Description' },
            startTime: new Date('2024-01-02T10:00:00Z'),
            endTime: new Date('2024-01-02T11:00:00Z'),
            stage: 'tech',
            speakerIds: ['speaker1'],
            tags: ['tech'],
            isHighlight: false,
            isVisible: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          limit: 5,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated
        .mockResolvedValueOnce(mockHighlightSessions)
        .mockResolvedValueOnce(mockHighlightSpeakers)
        .mockResolvedValueOnce(mockUpcomingSessions);

      const result = await HomeService.fetchHomeData();

      expect(result).toEqual({
        highlightSessions: mockHighlightSessions.data,
        highlightSpeakers: mockHighlightSpeakers.data,
        upcomingSessions: mockUpcomingSessions.data,
      });

      expect(mockApiService.getPaginated).toHaveBeenCalledTimes(3);
      expect(mockApiService.getPaginated).toHaveBeenNthCalledWith(
        1,
        '/sessions',
        1,
        3,
        {
          isHighlight: true,
          isVisible: true,
          sort: 'startTime',
        }
      );
      expect(mockApiService.getPaginated).toHaveBeenNthCalledWith(
        2,
        '/speakers',
        1,
        4,
        {
          isHighlight: true,
          isVisible: true,
          sort: 'priority',
        }
      );
      expect(mockApiService.getPaginated).toHaveBeenNthCalledWith(
        3,
        '/sessions',
        1,
        5,
        expect.objectContaining({
          startTime_gte: expect.any(String),
          isVisible: true,
          sort: 'startTime',
        })
      );
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApiService.getPaginated.mockRejectedValue(error);

      await expect(HomeService.fetchHomeData()).rejects.toThrow('API Error');
    });
  });

  describe('getHighlightSessions', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 3,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      const result = await HomeService.getHighlightSessions();

      expect(result).toEqual(mockResponse);
      expect(mockApiService.getPaginated).toHaveBeenCalledWith(
        '/sessions',
        1,
        3,
        {
          isHighlight: true,
          isVisible: true,
          sort: 'startTime',
        }
      );
    });
  });

  describe('getHighlightSpeakers', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 4,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      const result = await HomeService.getHighlightSpeakers();

      expect(result).toEqual(mockResponse);
      expect(mockApiService.getPaginated).toHaveBeenCalledWith(
        '/speakers',
        1,
        4,
        {
          isHighlight: true,
          isVisible: true,
          sort: 'priority',
        }
      );
    });
  });

  describe('getUpcomingSessions', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 5,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockApiService.getPaginated.mockResolvedValue(mockResponse);

      const result = await HomeService.getUpcomingSessions();

      expect(result).toEqual(mockResponse);
      expect(mockApiService.getPaginated).toHaveBeenCalledWith(
        '/sessions',
        1,
        5,
        expect.objectContaining({
          startTime_gte: expect.any(String),
          isVisible: true,
          sort: 'startTime',
        })
      );
    });
  });

  describe('refreshHomeData', () => {
    it('should call fetchHomeData', async () => {
      const mockData = {
        highlightSessions: [],
        highlightSpeakers: [],
        upcomingSessions: [],
      };

      jest.spyOn(HomeService, 'fetchHomeData').mockResolvedValue(mockData);

      const result = await HomeService.refreshHomeData();

      expect(result).toEqual(mockData);
      expect(HomeService.fetchHomeData).toHaveBeenCalled();
    });
  });
});