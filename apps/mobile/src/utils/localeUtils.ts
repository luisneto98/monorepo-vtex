import * as Localization from 'expo-localization';
import { SupportedLanguage, LegalPageType } from '@shared/types/legal-pages';

/**
 * Mobile-recognized slug patterns for legal pages
 * These slugs will be displayed in the mobile app
 */
export const MOBILE_SLUG_PATTERNS = {
  terms: ['terms-of-use', 'termos-de-uso', 'terms', 'termos'],
  privacy: ['privacy-policy', 'politica-de-privacidade', 'privacy', 'privacidade'],
  cookies: ['cookies-policy', 'politica-de-cookies', 'cookies'],
};

/**
 * Get device language based on device locale
 * @returns SupportedLanguage enum value (pt, en, es)
 * @default SupportedLanguage.PT (Portuguese fallback)
 */
export const getDeviceLanguage = (): SupportedLanguage => {
  const locale = Localization.locale; // e.g., "pt-BR", "en-US", "es-ES"

  // Handle undefined or empty locale
  if (!locale || typeof locale !== 'string') {
    return SupportedLanguage.PT; // Fallback to Portuguese
  }

  const languageCode = locale.split('-')[0].toLowerCase(); // Extract "pt", "en", "es"

  switch (languageCode) {
    case 'pt':
      return SupportedLanguage.PT;
    case 'en':
      return SupportedLanguage.EN;
    case 'es':
      return SupportedLanguage.ES;
    default:
      return SupportedLanguage.PT; // Fallback to Portuguese
  }
};

/**
 * Get available language for a document with fallback logic
 * Priority: preferredLanguage → pt-BR → en → es → first available
 * @param availableLanguages - Array of available language codes
 * @param preferredLanguage - User's preferred language (defaults to device language)
 * @returns Best available language or first available as fallback
 */
export const getAvailableLanguageForDocument = (
  availableLanguages: string[],
  preferredLanguage?: SupportedLanguage
): SupportedLanguage => {
  if (!availableLanguages || availableLanguages.length === 0) {
    return SupportedLanguage.PT; // Default fallback
  }

  const preferred = preferredLanguage || getDeviceLanguage();

  // Check if preferred language is available
  if (availableLanguages.includes(preferred)) {
    return preferred;
  }

  // Fallback chain: pt → en → es → first available
  const fallbackChain = [SupportedLanguage.PT, SupportedLanguage.EN, SupportedLanguage.ES];

  for (const lang of fallbackChain) {
    if (availableLanguages.includes(lang)) {
      return lang;
    }
  }

  // Return first available language if none in fallback chain match
  return availableLanguages[0] as SupportedLanguage;
};

/**
 * Get icon name for legal page type
 * @param type - Legal page type
 * @returns Icon name (can be used with icon libraries)
 */
export const getLegalPageIcon = (type: LegalPageType): string => {
  switch (type) {
    case LegalPageType.TERMS:
      return 'gavel'; // or 'scale-balance', 'file-contract'
    case LegalPageType.PRIVACY:
      return 'shield-check'; // or 'lock', 'shield-halved'
    case LegalPageType.COOKIES:
      return 'cookie-bite'; // or 'cookie'
    case LegalPageType.OTHER:
      return 'file-lines'; // or 'file-alt'
    default:
      return 'file-lines';
  }
};

/**
 * Get localized label for legal page type
 * @param type - Legal page type
 * @param locale - Locale for translation
 * @returns Localized type name
 */
export const getLegalPageTypeLabel = (type: LegalPageType, locale: SupportedLanguage = SupportedLanguage.PT): string => {
  const labels = {
    [LegalPageType.TERMS]: {
      [SupportedLanguage.PT]: 'Termos de Uso',
      [SupportedLanguage.EN]: 'Terms of Use',
      [SupportedLanguage.ES]: 'Términos de Uso',
    },
    [LegalPageType.PRIVACY]: {
      [SupportedLanguage.PT]: 'Política de Privacidade',
      [SupportedLanguage.EN]: 'Privacy Policy',
      [SupportedLanguage.ES]: 'Política de Privacidad',
    },
    [LegalPageType.COOKIES]: {
      [SupportedLanguage.PT]: 'Política de Cookies',
      [SupportedLanguage.EN]: 'Cookie Policy',
      [SupportedLanguage.ES]: 'Política de Cookies',
    },
    [LegalPageType.OTHER]: {
      [SupportedLanguage.PT]: 'Outro',
      [SupportedLanguage.EN]: 'Other',
      [SupportedLanguage.ES]: 'Otro',
    },
  };

  return labels[type]?.[locale] || labels[LegalPageType.OTHER][locale];
};

/**
 * Check if a slug is recognized for mobile display
 * @param slug - Legal page slug to check
 * @returns true if slug matches mobile patterns
 */
export const isMobileCompatibleSlug = (slug: string): boolean => {
  const normalizedSlug = slug.toLowerCase();

  return Object.values(MOBILE_SLUG_PATTERNS).some(patterns =>
    patterns.some(pattern => pattern.toLowerCase() === normalizedSlug)
  );
};

/**
 * Get language display name
 * @param language - Language code
 * @returns Display name for the language
 */
export const getLanguageDisplayName = (language: string): string => {
  const displayNames: Record<string, string> = {
    [SupportedLanguage.PT]: 'Português',
    [SupportedLanguage.EN]: 'English',
    [SupportedLanguage.ES]: 'Español',
  };

  return displayNames[language] || language.toUpperCase();
};
