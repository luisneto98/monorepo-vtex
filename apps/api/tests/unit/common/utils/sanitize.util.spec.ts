import {
  sanitizeNotificationTitle,
  sanitizeNotificationContent,
} from '../../../../src/common/utils/sanitize.util';

describe('Sanitize Utilities', () => {
  describe('sanitizeNotificationTitle', () => {
    it('should escape HTML tags and remove injection characters', () => {
      const input = '<script>alert("xss")</script>Important Update';
      const result = sanitizeNotificationTitle(input);
      // HTML tags escaped, then quotes/brackets removed
      expect(result).not.toContain('<script>');
      expect(result).toContain('Important Update');
    });

    it('should remove special injection characters', () => {
      const input = 'Title with special chars!';
      const result = sanitizeNotificationTitle(input);
      expect(result).toBe('Title with special chars!');
    });

    it('should escape and remove dangerous characters', () => {
      const input = 'Title<>"\' `test';
      const result = sanitizeNotificationTitle(input);
      // Should not contain injection characters
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
      expect(result).not.toContain('`');
      expect(result).toContain('Title');
      expect(result).toContain('test');
    });

    it('should preserve safe characters', () => {
      const input = 'Event Update: Session at 3PM!';
      const result = sanitizeNotificationTitle(input);
      expect(result).toBe('Event Update: Session at 3PM!');
    });

    it('should handle empty string', () => {
      const result = sanitizeNotificationTitle('');
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  Important Notice  ';
      const result = sanitizeNotificationTitle(input);
      expect(result).toBe('Important Notice');
    });

    it('should handle unicode characters safely', () => {
      const input = 'Atualização Importante 🔔';
      const result = sanitizeNotificationTitle(input);
      expect(result).toBe('Atualização Importante 🔔');
    });
  });

  describe('sanitizeNotificationContent', () => {
    it('should escape HTML tags', () => {
      const input = '<p>This is <strong>bold</strong> text</p>';
      const result = sanitizeNotificationContent(input);
      // HTML tags are escaped, not removed
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<strong>');
      expect(result).toContain('This is');
      expect(result).toContain('bold');
      expect(result).toContain('text');
    });

    it('should escape script tags', () => {
      const input = 'Safe text<script>malicious()</script>more text';
      const result = sanitizeNotificationContent(input);
      // Script tags escaped
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe text');
      expect(result).toContain('more text');
    });

    it('should escape style tags', () => {
      const input = '<style>.hide{display:none}</style>Visible content';
      const result = sanitizeNotificationContent(input);
      expect(result).not.toContain('<style>');
      expect(result).toContain('Visible content');
    });

    it('should preserve line breaks as spaces', () => {
      const input = 'Line 1\nLine 2\nLine 3';
      const result = sanitizeNotificationContent(input);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle mixed content', () => {
      const input = 'Check <a href="evil.com">this link</a> for updates!';
      const result = sanitizeNotificationContent(input);
      expect(result).not.toContain('<a');
      expect(result).not.toContain('href');
      expect(result).toContain('this link');
      expect(result).toContain('for updates!');
    });

    it('should preserve safe punctuation', () => {
      const input = "Event starts at 3:00 PM. Don't miss it!";
      const result = sanitizeNotificationContent(input);
      expect(result).toBe("Event starts at 3:00 PM. Don't miss it!");
    });

    it('should handle empty string', () => {
      const result = sanitizeNotificationContent('');
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  Message with spaces  ';
      const result = sanitizeNotificationContent(input);
      expect(result).toBe('Message with spaces');
    });

    it('should handle complex XSS attempts', () => {
      const input = '<img src=x onerror="alert(1)">Text<iframe src="evil"></iframe>';
      const result = sanitizeNotificationContent(input);
      expect(result).not.toContain('<img');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<iframe');
      expect(result).toContain('Text');
    });

    it('should preserve emoji and special characters', () => {
      const input = 'Nova sessão disponível! 🎉 Não perca! ✨';
      const result = sanitizeNotificationContent(input);
      expect(result).toBe('Nova sessão disponível! 🎉 Não perca! ✨');
    });
  });
});
