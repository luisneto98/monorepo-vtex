import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export class SanitizationUtil {
  static sanitizeText(text: string): string {
    if (!text) return text;

    // Remove all HTML tags and scripts
    return purify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  static sanitizeLocalizedString(obj: any): any {
    if (!obj) return obj;

    const sanitized = { ...obj };
    if (obj.pt) sanitized.pt = SanitizationUtil.sanitizeText(obj.pt);
    if (obj.en) sanitized.en = SanitizationUtil.sanitizeText(obj.en);
    if (obj.es) sanitized.es = SanitizationUtil.sanitizeText(obj.es);

    return sanitized;
  }

  static sanitizeTags(tags: string[]): string[] {
    if (!tags || !Array.isArray(tags)) return tags;
    return tags.map((tag) => SanitizationUtil.sanitizeText(tag));
  }

  static sanitizeFilePath(path: string): string {
    if (!path) return path;

    // Remove path traversal attempts
    return path
      .replace(/\.\./g, '')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/')
      .replace(/[^a-zA-Z0-9-_./]/g, '');
  }
}
