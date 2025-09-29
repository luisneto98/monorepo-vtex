import SpeakerService from '../SpeakerService';
import apiService from '../api';

jest.mock('../api');

describe('SpeakerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SpeakerService.clearCache();
  });

  const mockSpeakerResponse = {
    success: true,
    data: {
      _id: 'speaker-1',
      name: 'Jane Smith',
      bio: { 'pt-BR': 'Biografia em português', en: 'Biography in English' },
      photoUrl: 'https://example.com/jane.jpg',
      company: 'Innovation Labs',
      position: { 'pt-BR': 'CTO', en: 'CTO' },
      socialLinks: {
        linkedin: 'https://linkedin.com/in/janesmith',
        twitter: 'https://twitter.com/janesmith',
        github: 'https://github.com/janesmith',
        website: 'https://janesmith.com',
      },
      priority: 1,
      isHighlight: true,
      isVisible: true,
    },
  };

  const mockSessionsResponse = {
    success: true,
    data: [
      {
        _id: 'session-1',
        title: { 'pt-BR': 'Palestra 1', en: 'Talk 1' },
        description: { 'pt-BR': 'Descrição 1', en: 'Description 1' },
        type: 'talk',
        startTime: '2025-10-01T10:00:00Z',
        endTime: '2025-10-01T11:00:00Z',
        stage: 'Principal',
        speakerIds: ['speaker-1'],
        tags: ['tech'],
        isHighlight: false,
        isVisible: true,
        technicalLevel: 'beginner',
        language: 'pt-BR',
      },
      {
        _id: 'session-2',
        title: { 'pt-BR': 'Palestra 2', en: 'Talk 2' },
        description: { 'pt-BR': 'Descrição 2', en: 'Description 2' },
        type: 'panel',
        startTime: '2025-10-01T14:00:00Z',
        endTime: '2025-10-01T15:00:00Z',
        stage: 'Inovação',
        speakerIds: ['speaker-1', 'speaker-2'],
        tags: ['innovation'],
        isHighlight: true,
        isVisible: true,
        technicalLevel: 'advanced',
        language: 'en',
      },
    ],
    metadata: {
      total: 2,
      page: 1,
      limit: 20,
      hasNext: false,
      hasPrev: false,
    },
  };

  describe('getSpeakerById', () => {
    it('should fetch speaker profile successfully', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSpeakerResponse);

      const result = await SpeakerService.getSpeakerById('speaker-1');

      expect(apiService.get).toHaveBeenCalledWith('/speakers/speaker-1');
      expect(result._id).toBe('speaker-1');
      expect(result.name).toBe('Jane Smith');
      expect(result.socialLinks.linkedin).toBe('https://linkedin.com/in/janesmith');
    });

    it('should cache speaker profile', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSpeakerResponse);

      // First call
      await SpeakerService.getSpeakerById('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await SpeakerService.getSpeakerById('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error when speaker is not found', async () => {
      (apiService.get as jest.Mock).mockResolvedValue({
        success: false,
        data: null,
      });

      await expect(
        SpeakerService.getSpeakerById('invalid-id')
      ).rejects.toThrow('Palestrante não encontrado');
    });

    it('should handle API errors', async () => {
      (apiService.get as jest.Mock).mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(
        SpeakerService.getSpeakerById('speaker-1')
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('getSpeakerSessions', () => {
    it('should fetch speaker sessions successfully', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSessionsResponse);

      const result = await SpeakerService.getSpeakerSessions('speaker-1');

      expect(apiService.get).toHaveBeenCalledWith('/sessions', { speakerId: 'speaker-1' });
      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe('session-1');
      expect(result[1]._id).toBe('session-2');
    });

    it('should cache speaker sessions', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSessionsResponse);

      // First call
      await SpeakerService.getSpeakerSessions('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await SpeakerService.getSpeakerSessions('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(1);
    });

    it('should transform session dates correctly', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSessionsResponse);

      const result = await SpeakerService.getSpeakerSessions('speaker-1');

      expect(result[0].startTime).toBeInstanceOf(Date);
      expect(result[0].endTime).toBeInstanceOf(Date);
      expect(result[1].startTime).toBeInstanceOf(Date);
      expect(result[1].endTime).toBeInstanceOf(Date);
    });

    it('should handle empty sessions list', async () => {
      (apiService.get as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 20,
          hasNext: false,
          hasPrev: false,
        },
      });

      const result = await SpeakerService.getSpeakerSessions('speaker-1');

      expect(result).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      (apiService.get as jest.Mock).mockRejectedValue(
        new Error('Server error')
      );

      await expect(
        SpeakerService.getSpeakerSessions('speaker-1')
      ).rejects.toThrow('Server error');
    });
  });

  describe('clearCache', () => {
    it('should clear specific speaker from cache', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSpeakerResponse);

      // Cache the speaker
      await SpeakerService.getSpeakerById('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(1);

      // Clear specific cache
      SpeakerService.clearCache('speaker-1');

      // Should fetch again
      await SpeakerService.getSpeakerById('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(2);
    });

    it('should clear both speaker and sessions cache for a speaker', async () => {
      (apiService.get as jest.Mock)
        .mockResolvedValueOnce(mockSpeakerResponse)
        .mockResolvedValueOnce(mockSessionsResponse);

      // Cache speaker and sessions
      await SpeakerService.getSpeakerById('speaker-1');
      await SpeakerService.getSpeakerSessions('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(2);

      // Clear cache for this speaker
      SpeakerService.clearCache('speaker-1');

      // Should fetch both again
      await SpeakerService.getSpeakerById('speaker-1');
      await SpeakerService.getSpeakerSessions('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(4);
    });

    it('should clear all cache', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockSpeakerResponse);

      // Cache multiple speakers
      await SpeakerService.getSpeakerById('speaker-1');
      await SpeakerService.getSpeakerById('speaker-2');
      expect(apiService.get).toHaveBeenCalledTimes(2);

      // Clear all cache
      SpeakerService.clearCache();

      // Should fetch again
      await SpeakerService.getSpeakerById('speaker-1');
      expect(apiService.get).toHaveBeenCalledTimes(3);
    });
  });
});