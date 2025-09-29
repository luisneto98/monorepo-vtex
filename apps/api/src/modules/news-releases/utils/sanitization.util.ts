import * as DOMPurify from 'isomorphic-dompurify';

export class SanitizationUtil {
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'a',
        'ul',
        'ol',
        'li',
        'blockquote',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'img',
        'iframe',
        'div',
        'span',
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',
        'pre',
        'code',
      ],
      ALLOWED_ATTR: [
        'href',
        'target',
        'src',
        'alt',
        'width',
        'height',
        'frameborder',
        'allowfullscreen',
        'class',
        'rel',
        'title',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true,
    });
  }

  static sanitizeText(text: string): string {
    return text?.trim().replace(/<[^>]*>?/gm, '');
  }

  static sanitizeFilePath(path: string): string {
    // Remove any null bytes
    let sanitized = path.replace(/\0/g, '');

    // Remove directory traversal attempts
    sanitized = sanitized.replace(/\.\./g, '');

    // Remove leading slashes
    sanitized = sanitized.replace(/^\/+/, '');

    // Remove any control characters
    sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '');

    // Normalize the path
    sanitized = sanitized.replace(/\/+/g, '/');

    // Ensure no path traversal patterns remain
    if (sanitized.includes('../') || sanitized.includes('..\\')) {
      throw new Error('Invalid file path');
    }

    return sanitized;
  }

  static sanitizeSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
