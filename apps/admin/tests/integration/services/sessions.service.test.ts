import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionsService } from '@/services/sessions.service';
import type { ISession } from '@shared/types/session.types';

describe('SessionsService Integration Tests', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    localStorage.clear();
    localStorage.setItem('access_token', 'test-token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('getSessions', () => {
    it('should fetch sessions with pagination params', async () => {
      const mockResponse = {
        success: true,
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await SessionsService.getSessions({
        page: 1,
        limit: 10,
        sort: '-startTime',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&limit=10&sort=-startTime'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle filter params correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await SessionsService.getSessions({
        search: 'test',
        stage: 'Main Stage',
        tags: 'technical',
      });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('search=test');
      expect(callUrl).toContain('stage=Main+Stage');
      expect(callUrl).toContain('tags=technical');
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const newSession = {
        title: { 'pt-BR': 'Nova Palestra', en: 'New Session' },
        description: { 'pt-BR': 'Descrição', en: 'Description' },
        speakerIds: ['speaker1'],
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
        tags: ['technical'],
        isHighlight: false,
        isVisible: true,
      };

      const mockResponse = {
        success: true,
        data: { ...newSession, _id: '123' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await SessionsService.createSession(newSession as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
          body: JSON.stringify(newSession),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Validation error' }),
      });

      await expect(SessionsService.createSession({} as any)).rejects.toThrow('Validation error');
    });
  });

  describe('updateSession', () => {
    it('should update an existing session', async () => {
      const updates = {
        title: { 'pt-BR': 'Título Atualizado', en: 'Updated Title' },
      };

      const mockResponse = {
        success: true,
        data: { _id: '123', ...updates },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await SessionsService.updateSession('123', updates);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await SessionsService.deleteSession('123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/123'),
        expect.objectContaining({
          method: 'DELETE',
        }),
      );

      expect(result).toEqual({ success: true });
    });
  });

  describe('checkConflicts', () => {
    it('should check for schedule conflicts', async () => {
      const conflictData = {
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
        speakerIds: ['speaker1'],
      };

      const mockResponse = {
        hasConflicts: true,
        conflicts: [
          {
            _id: '456',
            title: { 'pt-BR': 'Conflito', en: 'Conflict' },
            stage: 'Main Stage',
            startTime: new Date('2025-09-27T10:30:00'),
            endTime: new Date('2025-09-27T11:30:00'),
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await SessionsService.checkConflicts(conflictData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/check-conflicts'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(conflictData),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it('should exclude current session when checking conflicts', async () => {
      const conflictData = {
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
        speakerIds: [],
        excludeId: '123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasConflicts: false, conflicts: [] }),
      });

      await SessionsService.checkConflicts(conflictData);

      const bodyData = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(bodyData.excludeId).toBe('123');
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple sessions', async () => {
      const ids = ['123', '456', '789'];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, deleted: 3 }),
      });

      const result = await SessionsService.bulkDelete(ids);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/bulk-delete'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ids }),
        }),
      );

      expect(result).toEqual({ success: true, deleted: 3 });
    });
  });

  describe('bulkUpdateVisibility', () => {
    it('should update visibility for multiple sessions', async () => {
      const ids = ['123', '456'];
      const isVisible = false;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, updated: 2 }),
      });

      const result = await SessionsService.bulkUpdateVisibility(ids, isVisible);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/bulk-visibility'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ids, isVisible }),
        }),
      );

      expect(result).toEqual({ success: true, updated: 2 });
    });
  });

  describe('getAvailableFilters', () => {
    it('should fetch available filter options', async () => {
      const mockFilters = {
        stages: ['Main Stage', 'Workshop Room'],
        tags: ['technical', 'business'],
        technicalLevels: ['beginner', 'intermediate', 'advanced'],
        languages: ['pt-BR', 'en', 'es'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFilters,
      });

      const result = await SessionsService.getAvailableFilters();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/filters'),
        expect.objectContaining({
          method: 'GET',
        }),
      );

      expect(result).toEqual(mockFilters);
    });
  });

  describe('authentication', () => {
    it('should include auth token in headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await SessionsService.getSessions();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should work without auth token', async () => {
      localStorage.removeItem('access_token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await SessionsService.getSessions();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });
});
