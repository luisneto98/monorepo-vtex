/**
 * Format a date to Brazilian format (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a time to Brazilian format (HH:MM)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculate duration between two dates/times
 */
export function calculateDuration(startTime: Date | string, endTime: Date | string): string {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${minutes}min`;
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} às ${formatTime(date)}`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * Get relative time string (e.g., "em 2 horas", "há 30 minutos")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMinutes = Math.floor(Math.abs(diffMs) / 60000);

  const isPast = diffMs < 0;

  if (diffMinutes < 60) {
    return isPast ? `há ${diffMinutes} min` : `em ${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) {
    return isPast ? `há ${hours}h` : `em ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return isPast ? `há ${days} dia${days > 1 ? 's' : ''}` : `em ${days} dia${days > 1 ? 's' : ''}`;
}

/**
 * Format relative date with localization support
 * Returns strings like "2 days ago", "3 hours ago", etc.
 */
export function formatRelativeDate(date: Date | string, locale: string = 'pt-BR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Localization strings
  const strings: Record<string, Record<string, string>> = {
    'pt-BR': {
      justNow: 'agora mesmo',
      minuteAgo: 'há 1 minuto',
      minutesAgo: (n: number) => `há ${n} minutos`,
      hourAgo: 'há 1 hora',
      hoursAgo: (n: number) => `há ${n} horas`,
      dayAgo: 'há 1 dia',
      daysAgo: (n: number) => `há ${n} dias`,
      weekAgo: 'há 1 semana',
      weeksAgo: (n: number) => `há ${n} semanas`,
      monthAgo: 'há 1 mês',
      monthsAgo: (n: number) => `há ${n} meses`,
    },
    en: {
      justNow: 'just now',
      minuteAgo: '1 minute ago',
      minutesAgo: (n: number) => `${n} minutes ago`,
      hourAgo: '1 hour ago',
      hoursAgo: (n: number) => `${n} hours ago`,
      dayAgo: '1 day ago',
      daysAgo: (n: number) => `${n} days ago`,
      weekAgo: '1 week ago',
      weeksAgo: (n: number) => `${n} weeks ago`,
      monthAgo: '1 month ago',
      monthsAgo: (n: number) => `${n} months ago`,
    },
    es: {
      justNow: 'ahora mismo',
      minuteAgo: 'hace 1 minuto',
      minutesAgo: (n: number) => `hace ${n} minutos`,
      hourAgo: 'hace 1 hora',
      hoursAgo: (n: number) => `hace ${n} horas`,
      dayAgo: 'hace 1 día',
      daysAgo: (n: number) => `hace ${n} días`,
      weekAgo: 'hace 1 semana',
      weeksAgo: (n: number) => `hace ${n} semanas`,
      monthAgo: 'hace 1 mes',
      monthsAgo: (n: number) => `hace ${n} meses`,
    },
  };

  // Normalize locale
  let lang: 'pt-BR' | 'en' | 'es' = 'pt-BR';
  if (locale.startsWith('pt')) {
    lang = 'pt-BR';
  } else if (locale.startsWith('es')) {
    lang = 'es';
  } else if (locale.startsWith('en')) {
    lang = 'en';
  }

  const localeStrings = strings[lang];

  // Less than a minute
  if (diffSeconds < 60) {
    return localeStrings.justNow;
  }

  // Less than an hour
  if (diffMinutes < 60) {
    if (diffMinutes === 1) {
      return localeStrings.minuteAgo;
    }
    return typeof localeStrings.minutesAgo === 'function'
      ? localeStrings.minutesAgo(diffMinutes)
      : localeStrings.minutesAgo;
  }

  // Less than a day
  if (diffHours < 24) {
    if (diffHours === 1) {
      return localeStrings.hourAgo;
    }
    return typeof localeStrings.hoursAgo === 'function'
      ? localeStrings.hoursAgo(diffHours)
      : localeStrings.hoursAgo;
  }

  // Less than a week
  if (diffDays < 7) {
    if (diffDays === 1) {
      return localeStrings.dayAgo;
    }
    return typeof localeStrings.daysAgo === 'function'
      ? localeStrings.daysAgo(diffDays)
      : localeStrings.daysAgo;
  }

  // Less than a month (30 days)
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    if (weeks === 1) {
      return localeStrings.weekAgo;
    }
    return typeof localeStrings.weeksAgo === 'function'
      ? localeStrings.weeksAgo(weeks)
      : localeStrings.weeksAgo;
  }

  // More than a month - show months
  const months = Math.floor(diffDays / 30);
  if (months === 1) {
    return localeStrings.monthAgo;
  }
  return typeof localeStrings.monthsAgo === 'function'
    ? localeStrings.monthsAgo(months)
    : localeStrings.monthsAgo;
}

/**
 * Format full date with localization support
 * Returns strings like "January 15, 2025" or "15 de janeiro de 2025"
 */
export function formatFullDate(date: Date | string, locale: string = 'pt-BR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const monthNames: Record<string, string[]> = {
    'pt-BR': [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ],
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    es: [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ],
  };

  // Normalize locale
  let lang: 'pt-BR' | 'en' | 'es' = 'pt-BR';
  if (locale.startsWith('pt')) {
    lang = 'pt-BR';
  } else if (locale.startsWith('es')) {
    lang = 'es';
  } else if (locale.startsWith('en')) {
    lang = 'en';
  }

  const day = d.getDate();
  const month = monthNames[lang][d.getMonth()];
  const year = d.getFullYear();

  if (lang === 'en') {
    return `${month} ${day}, ${year}`;
  }

  return `${day} de ${month} de ${year}`;
}