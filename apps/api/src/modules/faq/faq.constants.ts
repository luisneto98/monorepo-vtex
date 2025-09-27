export const FAQ_CONSTANTS = {
  // Field length limits
  QUESTION_MAX_LENGTH: 200,
  ANSWER_MAX_LENGTH: 2000,

  // Numeric constraints
  ORDER_MIN_VALUE: 1,
  VIEW_COUNT_MIN_VALUE: 0,

  // Default values
  DEFAULT_POPULAR_LIMIT: 10,
  DEFAULT_PAGE_LIMIT: 20,

  // HTML content limits
  ANSWER_HTML_MAX_SIZE_KB: 10,
  ANSWER_HTML_MAX_SIZE_BYTES: 10 * 1024, // 10KB

  // Rate limiting
  VIEW_INCREMENT_RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  VIEW_INCREMENT_MAX_REQUESTS_PER_WINDOW: 5,

  // Search debounce
  SEARCH_DEBOUNCE_MS: 500,
} as const;

export const FAQ_CATEGORY_CONSTANTS = {
  // Field length limits
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,

  // Numeric constraints
  ORDER_MIN_VALUE: 1,
} as const;