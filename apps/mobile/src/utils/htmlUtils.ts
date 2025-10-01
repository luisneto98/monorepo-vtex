/**
 * Utility functions for HTML content processing
 * Used for sanitization and text extraction from HTML
 */

/**
 * Basic client-side HTML sanitization
 * Removes dangerous tags and attributes that could execute scripts
 * Note: Backend should already sanitize, this is an additional layer
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove object/embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^<]*>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocol from links
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');

  return sanitized;
}

/**
 * Strip all HTML tags from a string
 * Useful for generating plain text excerpts from HTML content
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';

  // Remove all HTML tags
  let text = html.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Trim whitespace
  text = text.trim();

  return text;
}

/**
 * Truncate HTML content to a specific length while preserving tags
 * Returns a truncated version with ellipsis
 */
export function truncateHtml(html: string, maxLength: number = 150): string {
  const plainText = stripHtmlTags(html);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate at word boundary
  let truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    truncated = truncated.substring(0, lastSpace);
  }

  return truncated + '...';
}

/**
 * Extract first paragraph from HTML content
 * Useful for generating excerpts
 */
export function extractFirstParagraph(html: string): string {
  if (!html) return '';

  // Match first <p> tag content
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i);

  if (match && match[1]) {
    return stripHtmlTags(match[1]);
  }

  // Fallback to truncating the whole content
  return truncateHtml(html, 200);
}
