import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionsService } from '@/services/sessions.service';

describe('Conflict Detection Integration Tests', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    localStorage.setItem('access_token', 'test-token');
    vi.clearAllMocks();
  });

  describe('Stage Conflicts', () => {
    it('should detect conflicts for same stage and overlapping time', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
        speakerIds: [],
      };

      const mockConflict = {
        _id: '123',
        title: { 'pt-BR': 'Conflito', 'en': 'Conflict' },
        startTime: new Date('2025-09-27T10:30:00'),
        endTime: new Date('2025-09-27T11:30:00'),
        stage: 'Main Stage',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: true,
          conflicts: [mockConflict],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].stage).toBe('Main Stage');
    });

    it('should not detect conflicts for different stages', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Workshop Room A',
        speakerIds: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: false,
          conflicts: [],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('Speaker Conflicts', () => {
    it('should detect conflicts when speaker is double-booked', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T14:00:00'),
        endTime: new Date('2025-09-27T15:00:00'),
        stage: 'Workshop Room B',
        speakerIds: ['speaker1', 'speaker2'],
      };

      const mockConflict = {
        _id: '456',
        title: { 'pt-BR': 'Outra Palestra', 'en': 'Another Session' },
        startTime: new Date('2025-09-27T14:30:00'),
        endTime: new Date('2025-09-27T15:30:00'),
        stage: 'Main Stage',
        speakerIds: ['speaker1'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: true,
          conflicts: [mockConflict],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].speakerIds).toContain('speaker1');
    });

    it('should allow multiple speakers in non-overlapping sessions', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
        speakerIds: ['speaker1', 'speaker2'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: false,
          conflicts: [],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(false);
    });
  });

  describe('Time Overlap Detection', () => {
    it('should detect exact time match as conflict', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
        speakerIds: [],
      };

      const mockConflict = {
        _id: '789',
        title: { 'pt-BR': 'Mesma Hora', 'en': 'Same Time' },
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: true,
          conflicts: [mockConflict],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0].startTime).toEqual(sessionData.startTime);
      expect(result.conflicts[0].endTime).toEqual(sessionData.endTime);
    });

    it('should detect partial overlap at start', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T10:30:00'),
        endTime: new Date('2025-09-27T11:30:00'),
        stage: 'Main Stage',
        speakerIds: [],
      };

      const mockConflict = {
        _id: '111',
        title: { 'pt-BR': 'Overlap Início', 'en': 'Start Overlap' },
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: true,
          conflicts: [mockConflict],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(true);
    });

    it('should detect partial overlap at end', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T09:30:00'),
        endTime: new Date('2025-09-27T10:30:00'),
        stage: 'Main Stage',
        speakerIds: [],
      };

      const mockConflict = {
        _id: '222',
        title: { 'pt-BR': 'Overlap Fim', 'en': 'End Overlap' },
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: true,
          conflicts: [mockConflict],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(true);
    });

    it('should detect when session is completely contained within another', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T10:15:00'),
        endTime: new Date('2025-09-27T10:45:00'),
        stage: 'Main Stage',
        speakerIds: [],
      };

      const mockConflict = {
        _id: '333',
        title: { 'pt-BR': 'Sessão Maior', 'en': 'Larger Session' },
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: true,
          conflicts: [mockConflict],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(true);
    });

    it('should not detect conflicts for adjacent sessions', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T11:00:00'),
        endTime: new Date('2025-09-27T12:00:00'),
        stage: 'Main Stage',
        speakerIds: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: false,
          conflicts: [],
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(false);
    });
  });

  describe('Multiple Conflicts', () => {
    it('should detect multiple conflicts', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T12:00:00'),
        stage: 'Main Stage',
        speakerIds: ['speaker1'],
      };

      const mockConflicts = [
        {
          _id: '444',
          title: { 'pt-BR': 'Conflito 1', 'en': 'Conflict 1' },
          startTime: new Date('2025-09-27T10:30:00'),
          endTime: new Date('2025-09-27T11:00:00'),
          stage: 'Main Stage',
        },
        {
          _id: '555',
          title: { 'pt-BR': 'Conflito 2', 'en': 'Conflict 2' },
          startTime: new Date('2025-09-27T11:00:00'),
          endTime: new Date('2025-09-27T11:30:00'),
          stage: 'Main Stage',
        },
        {
          _id: '666',
          title: { 'pt-BR': 'Conflito Speaker', 'en': 'Speaker Conflict' },
          startTime: new Date('2025-09-27T11:00:00'),
          endTime: new Date('2025-09-27T12:00:00'),
          stage: 'Workshop Room',
          speakerIds: ['speaker1'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: true,
          conflicts: mockConflicts,
        }),
      });

      const result = await SessionsService.checkConflicts(sessionData);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(3);
    });
  });

  describe('Exclusion Logic', () => {
    it('should exclude current session when checking for updates', async () => {
      const sessionData = {
        startTime: new Date('2025-09-27T10:00:00'),
        endTime: new Date('2025-09-27T11:00:00'),
        stage: 'Main Stage',
        speakerIds: [],
        excludeId: 'current-session-id',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasConflicts: false,
          conflicts: [],
        }),
      });

      await SessionsService.checkConflicts(sessionData);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.excludeId).toBe('current-session-id');
    });
  });
});