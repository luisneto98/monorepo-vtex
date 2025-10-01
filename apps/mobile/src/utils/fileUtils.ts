import { PressMaterialType } from '@monorepo-vtex/shared/types/press-materials';

/**
 * Format file size from bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "150 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Limit to 1 decimal place
  const value = bytes / Math.pow(k, i);
  const formatted = i === 0 ? value : value.toFixed(1);

  return `${formatted} ${sizes[i]}`;
}

/**
 * Get file format icon name based on file format/extension
 * Returns icon name compatible with Ionicons or similar icon libraries
 * @param format - File format/extension (e.g., "pdf", "jpg", "mp4")
 * @returns Icon name string
 */
export function getFileIcon(format: string): string {
  const formatLower = format.toLowerCase();

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(formatLower)) {
    return 'image-outline';
  }

  // Videos
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'].includes(formatLower)) {
    return 'videocam-outline';
  }

  // Documents
  if (['pdf'].includes(formatLower)) {
    return 'document-text-outline';
  }

  if (['doc', 'docx'].includes(formatLower)) {
    return 'document-outline';
  }

  if (['ppt', 'pptx'].includes(formatLower)) {
    return 'easel-outline';
  }

  if (['xls', 'xlsx'].includes(formatLower)) {
    return 'grid-outline';
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(formatLower)) {
    return 'folder-outline';
  }

  // Default
  return 'document-outline';
}

/**
 * Get localized material type label
 * @param type - Material type
 * @param locale - Device locale (e.g., "pt-BR", "en", "es")
 * @returns Localized type label
 */
export function getMaterialTypeLabel(type: PressMaterialType, locale: string = 'pt-BR'): string {
  const labels: Record<PressMaterialType, { pt: string; en: string; es: string }> = {
    press_kit: {
      pt: 'Kit de Imprensa',
      en: 'Press Kit',
      es: 'Kit de Prensa',
    },
    logo_package: {
      pt: 'Logos',
      en: 'Logos',
      es: 'Logos',
    },
    photo: {
      pt: 'Fotos',
      en: 'Photos',
      es: 'Fotos',
    },
    video: {
      pt: 'Vídeos',
      en: 'Videos',
      es: 'Videos',
    },
    presentation: {
      pt: 'Apresentações',
      en: 'Presentations',
      es: 'Presentaciones',
    },
  };

  const typeLabels = labels[type];

  // Normalize locale to supported languages
  if (locale.startsWith('pt')) {
    return typeLabels.pt;
  } else if (locale.startsWith('es')) {
    return typeLabels.es;
  } else if (locale.startsWith('en')) {
    return typeLabels.en;
  }

  // Fallback to Portuguese
  return typeLabels.pt;
}

/**
 * Get icon for material type
 * @param type - Material type
 * @returns Icon name string compatible with Ionicons
 */
export function getMaterialTypeIcon(type: PressMaterialType): string {
  const icons: Record<PressMaterialType, string> = {
    press_kit: 'briefcase-outline',
    logo_package: 'image-outline',
    photo: 'images-outline',
    video: 'videocam-outline',
    presentation: 'easel-outline',
  };

  return icons[type] || 'document-outline';
}

/**
 * Check if file size exceeds warning threshold (50MB)
 * @param bytes - File size in bytes
 * @returns true if file is larger than 50MB
 */
export function isLargeFile(bytes: number): boolean {
  const MB_50 = 50 * 1024 * 1024;
  return bytes > MB_50;
}

/**
 * Get file extension from format string
 * @param format - File format (e.g., "jpg", "pdf")
 * @returns Uppercase extension with dot (e.g., ".JPG")
 */
export function getFileExtension(format: string): string {
  return `.${format.toUpperCase()}`;
}
