/**
 * Formats Brazilian phone numbers with proper masking
 * Supports both landline and mobile formats
 * @param value - The raw phone number string
 * @returns Formatted phone number string
 */
export function formatBrazilianPhone(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');

  // Limit to 11 digits (Brazilian phone format)
  const limited = cleaned.substring(0, 11);

  // Apply formatting based on length
  if (limited.length === 0) return '';
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  }
  if (limited.length <= 10) {
    // Landline format: (11) 1234-5678
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  // Mobile format: (11) 91234-5678
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

/**
 * Validates Brazilian phone number format
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export function validateBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');

  // Check if it has 10 (landline) or 11 (mobile) digits
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return false;
  }

  // Check valid area codes (11-99)
  const areaCode = parseInt(cleaned.substring(0, 2));
  if (areaCode < 11 || areaCode > 99) {
    return false;
  }

  // Mobile numbers start with 9
  if (cleaned.length === 11 && cleaned[2] !== '9') {
    return false;
  }

  return true;
}

/**
 * Memoized phone formatter for performance
 */
const phoneCache = new Map<string, string>();
export function formatPhoneMemoized(value: string): string {
  if (phoneCache.has(value)) {
    return phoneCache.get(value)!;
  }
  const formatted = formatBrazilianPhone(value);
  phoneCache.set(value, formatted);

  // Limit cache size to prevent memory leaks
  if (phoneCache.size > 100) {
    const firstKey = phoneCache.keys().next().value;
    if (firstKey) phoneCache.delete(firstKey);
  }

  return formatted;
}
