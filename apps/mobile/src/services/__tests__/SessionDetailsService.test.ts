import SessionDetailsService from '../SessionDetailsService';
import apiService from '../api';

jest.mock('../api');

describe('SessionDetailsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SessionDetailsService.clearCache();
  });

  const mockSessionResponse = {
    success: true,
    data: {
      _id: 'session-1',
      title: { 'pt-BR': 'Palestra Teste', en: 'Test Talk' },
      description: { 'pt-BR': 'Descrição teste', en: 'Test description' },
      type: 'talk',
      startTime: '2025-10-01T10:00:00Z',
      endTime: '2025-10-01T11:00:00Z',
      stage: 'Principal',
      speakerIds: [
        {
          _id: 'speaker-1',
          name: 'John Doe',
          photoUrl: 'https://example.com/photo.jpg',
          company: 'Tech Corp',
          bio: { 'pt-BR': 'Bio em português', en: 'Bio in English' },
          position: { 'pt-BR': 'Desenvolvedor', en: 'Developer' },
          socialLinks: {
            linkedin: 'https://linkedin.com/in/johndoe',
          },
          priority: 1,
          isHighlight: true,
          isVisible: true,
        },
      ],
      sponsorIds: [],
      tags: ['tech', 'development'],
      capacity: 100,
      registeredCount: 50,
      isHighlight: true,
      isVisible: true,
      technicalLevel: 'intermediate',
      language: 'pt-BR',
    },
  };

  describe('getSessionById', () => {
    it('should fetch session details successfully', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSessionResponse);

      const result = await SessionDetailsService.getSessionById('session-1');

      expect(apiService.get).toHaveBeenCalledWith('/sessions/session-1');
      expect(result.session._id).toBe('session-1');
      expect(result.speakers).toHaveLength(1);
      expect(result.speakers[0].name).toBe('John Doe');
    });

    it('should cache session details', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSessionResponse);

      // First call
      await SessionDetailsService.getSessionById('session-1');
      expect(apiService.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await SessionDetailsService.getSessionById('session-1');
      expect(apiService.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error when session is not found', async () => {
      (apiService.get as jest.Mock).mockResolvedValue({
        success: false,
        data: null,
      });

      await expect(
        SessionDetailsService.getSessionById('invalid-id')
      ).rejects.toThrow('Sessão não encontrada');
    });

    it('should handle API errors', async () => {
      (apiService.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        SessionDetailsService.getSessionById('session-1')
      ).rejects.toThrow('Network error');
    });

    it('should transform dates correctly', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSessionResponse);

      const result = await SessionDetailsService.getSessionById('session-1');

      expect(result.session.startTime).toBeInstanceOf(Date);
      expect(result.session.endTime).toBeInstanceOf(Date);
    });
  });

  describe('clearCache', () => {
    it('should clear specific session from cache', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSessionResponse);

      // Cache the session
      await SessionDetailsService.getSessionById('session-1');
      expect(apiService.get).toHaveBeenCalledTimes(1);

      // Clear specific cache
      SessionDetailsService.clearCache('session-1');

      // Should fetch again
      await SessionDetailsService.getSessionById('session-1');
      expect(apiService.get).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSessionResponse);

      // Cache multiple sessions
      await SessionDetailsService.getSessionById('session-1');
      await SessionDetailsService.getSessionById('session-2');
      expect(apiService.get).toHaveBeenCalledTimes(2);

      // Clear all cache
      SessionDetailsService.clearCache();

      // Should fetch again
      await SessionDetailsService.getSessionById('session-1');
      expect(apiService.get).toHaveBeenCalledTimes(3);
    });
  });
});