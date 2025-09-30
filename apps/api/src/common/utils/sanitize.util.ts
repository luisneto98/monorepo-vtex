import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes notification content to prevent XSS attacks
 * Removes all HTML tags and potentially harmful content
 * @param content - Raw user input content
 * @returns Sanitized safe content
 */
export function sanitizeNotificationContent(content: string): string {
  if (!content) {
    return '';
  }

  // Strip all HTML tags and scripts, keeping only plain text
  return sanitizeHtml(content, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    disallowedTagsMode: 'recursiveEscape', // Escape disallowed tags instead of stripping
  }).trim();
}

/**
 * Sanitizes notification title with strict rules
 * @param title - Raw user input title
 * @returns Sanitized safe title
 */
export function sanitizeNotificationTitle(title: string): string {
  if (!title) {
    return '';
  }

  // Strip all HTML and limit to plain text
  const sanitized = sanitizeHtml(title, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  }).trim();

  // Remove any remaining special characters that could be used for injection
  return sanitized.replace(/[<>\"'`]/g, '');
}

/**
 * Validates and sanitizes a complete notification object
 * @param notification - Notification data to sanitize
 * @returns Sanitized notification object
 */
export function sanitizeNotification(notification: {
  title?: string;
  message?: string;
  [key: string]: any;
}): { title?: string; message?: string; [key: string]: any } {
  const result: any = { ...notification };

  if (notification.title !== undefined) {
    result.title = sanitizeNotificationTitle(notification.title);
  }

  if (notification.message !== undefined) {
    result.message = sanitizeNotificationContent(notification.message);
  }

  return result;
}