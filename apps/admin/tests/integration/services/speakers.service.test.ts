import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { speakersService } from '@/services/speakers.service';
import type { Speaker, CreateSpeakerDto } from '@shared/types/speaker.types';

vi.mock('axios');

describe('SpeakersService', () => {
  const mockToken = 'mock-jwt-token';
  const API_URL = 'http://localhost:3000/api';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', mockToken);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getSpeakers', () => {
    it('fetches speakers with default parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          metadata: {
            total: 0,
            page: 1,
            limit: 10,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

      const result = await speakersService.getSpeakers();

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/speakers?`,
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('fetches speakers with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          metadata: {
            total: 0,
            page: 2,
            limit: 20,
            hasNext: false,
            hasPrev: true,
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

      const filters = {
        page: 2,
        limit: 20,
        search: 'John',
        company: 'Tech Corp',
        isHighlight: true,
        sort: 'name',
      };

      await speakersService.getSpeakers(filters);

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object));
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object),
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('search=John'),
        expect.any(Object),
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('company=Tech+Corp'),
        expect.any(Object),
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('isHighlight=true'),
        expect.any(Object),
      );
    });
  });

  describe('getSpeaker', () => {
    it('fetches a single speaker by ID', async () => {
      const mockSpeaker: Speaker = {
        _id: '1',
        name: 'John Doe',
        bio: { 'pt-BR': 'Bio PT', en: 'Bio EN' },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'Tech Corp',
        position: { 'pt-BR': 'Diretor', en: 'Director' },
        socialLinks: {},
        priority: 1,
        isHighlight: false,
        isVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { success: true, data: mockSpeaker },
      });

      const result = await speakersService.getSpeaker('1');

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/speakers/1`,
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockSpeaker);
    });
  });

  describe('createSpeaker', () => {
    it('creates a new speaker', async () => {
      const newSpeaker: CreateSpeakerDto = {
        name: 'Jane Smith',
        bio: { 'pt-BR': 'Bio PT', en: 'Bio EN' },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'New Corp',
        position: { 'pt-BR': 'CEO', en: 'CEO' },
        socialLinks: {},
        priority: 1,
        isHighlight: false,
        isVisible: true,
      };

      const createdSpeaker = { ...newSpeaker, _id: '2' };

      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { success: true, data: createdSpeaker },
      });

      const result = await speakersService.createSpeaker(newSpeaker);

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/speakers`,
        newSpeaker,
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(createdSpeaker);
    });
  });

  describe('updateSpeaker', () => {
    it('updates an existing speaker', async () => {
      const updates = { name: 'Updated Name' };
      const updatedSpeaker = { _id: '1', name: 'Updated Name' };

      vi.mocked(axios.put).mockResolvedValueOnce({
        data: { success: true, data: updatedSpeaker },
      });

      const result = await speakersService.updateSpeaker('1', updates);

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/speakers/1`,
        updates,
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(updatedSpeaker);
    });
  });

  describe('deleteSpeaker', () => {
    it('deletes a speaker', async () => {
      vi.mocked(axios.delete).mockResolvedValueOnce({
        data: { success: true },
      });

      await speakersService.deleteSpeaker('1');

      expect(axios.delete).toHaveBeenCalledWith(
        `${API_URL}/speakers/1`,
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
    });
  });

  describe('uploadPhoto', () => {
    it('uploads a photo file', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockUrl = 'https://example.com/uploaded.jpg';

      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { url: mockUrl },
      });

      const result = await speakersService.uploadPhoto(file);

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/upload/speaker-photo`,
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'multipart/form-data',
          }),
        }),
      );
      expect(result).toEqual({ url: mockUrl });
    });
  });

  describe('authentication', () => {
    it('does not include auth header when no token', async () => {
      localStorage.removeItem('token');

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

      await speakersService.getSpeakers();

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: {} }),
      );
    });
  });
});
