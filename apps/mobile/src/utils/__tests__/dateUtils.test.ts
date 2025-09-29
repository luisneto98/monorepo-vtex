import {
  formatDate,
  formatTime,
  calculateDuration,
  formatDateTime,
  isToday,
  getRelativeTime,
} from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-10-01T10:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/\d{2}\/\d{2}\/2025/);
    });

    it('should handle string dates', () => {
      const result = formatDate('2025-10-01T10:00:00Z');
      expect(result).toMatch(/\d{2}\/\d{2}\/2025/);
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2025-10-01T14:30:00Z');
      const result = formatTime(date);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should pad single digits with zero', () => {
      const date = new Date('2025-10-01T09:05:00Z');
      const result = formatTime(date);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle string dates', () => {
      const result = formatTime('2025-10-01T14:30:00Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration in minutes', () => {
      const start = new Date('2025-10-01T10:00:00Z');
      const end = new Date('2025-10-01T10:30:00Z');
      const result = calculateDuration(start, end);
      expect(result).toBe('30 min');
    });

    it('should calculate duration in hours', () => {
      const start = new Date('2025-10-01T10:00:00Z');
      const end = new Date('2025-10-01T12:00:00Z');
      const result = calculateDuration(start, end);
      expect(result).toBe('2h');
    });

    it('should calculate duration in hours and minutes', () => {
      const start = new Date('2025-10-01T10:00:00Z');
      const end = new Date('2025-10-01T11:45:00Z');
      const result = calculateDuration(start, end);
      expect(result).toBe('1h45min');
    });

    it('should handle string dates', () => {
      const result = calculateDuration(
        '2025-10-01T10:00:00Z',
        '2025-10-01T10:30:00Z'
      );
      expect(result).toBe('30 min');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const date = new Date('2025-10-01T14:30:00Z');
      const result = formatDateTime(date);
      expect(result).toContain(' às ');
      expect(result).toMatch(/\d{2}\/\d{2}\/2025 às \d{2}:\d{2}/);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      const result = isToday(today);
      expect(result).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = isToday(yesterday);
      expect(result).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = isToday(tomorrow);
      expect(result).toBe(false);
    });
  });

  describe('getRelativeTime', () => {
    it('should return "há X min" for past minutes', () => {
      const past = new Date();
      past.setMinutes(past.getMinutes() - 30);
      const result = getRelativeTime(past);
      expect(result).toContain('há');
      expect(result).toContain('min');
    });

    it('should return "em X min" for future minutes', () => {
      const future = new Date();
      future.setMinutes(future.getMinutes() + 15);
      const result = getRelativeTime(future);
      expect(result).toContain('em');
      expect(result).toContain('min');
    });

    it('should return "há X h" for past hours', () => {
      const past = new Date();
      past.setHours(past.getHours() - 3);
      const result = getRelativeTime(past);
      expect(result).toContain('há');
      expect(result).toContain('h');
    });

    it('should return "em X h" for future hours', () => {
      const future = new Date();
      future.setHours(future.getHours() + 5);
      const result = getRelativeTime(future);
      expect(result).toContain('em');
      expect(result).toContain('h');
    });

    it('should return "há X dia" for past days', () => {
      const past = new Date();
      past.setDate(past.getDate() - 2);
      const result = getRelativeTime(past);
      expect(result).toContain('há');
      expect(result).toContain('dia');
    });

    it('should return "em X dias" for future days', () => {
      const future = new Date();
      future.setDate(future.getDate() + 3);
      const result = getRelativeTime(future);
      expect(result).toContain('em');
      expect(result).toContain('dia');
    });
  });
});