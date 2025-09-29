import config from './env';

// List of required configuration keys
const REQUIRED_CONFIG: (keyof typeof config)[] = [
  'apiBaseUrl',
  'environment',
];

// List of optional configuration keys that should be present in production
const REQUIRED_IN_PRODUCTION: (keyof typeof config)[] = [
  // Add any configs that are required in production but optional in dev
  // 'sentryDsn',
];

// Validation errors collection
export interface ValidationError {
  key: string;
  message: string;
  severity: 'error' | 'warning';
}

export const validateEnvironment = (): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Check required configurations
  for (const key of REQUIRED_CONFIG) {
    if (!config[key]) {
      errors.push({
        key,
        message: `Missing required configuration: ${key}`,
        severity: 'error',
      });
    }
  }

  // Check production requirements
  if (config.environment === 'production') {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!config[key]) {
        errors.push({
          key,
          message: `Missing production configuration: ${key}`,
          severity: 'error',
        });
      }
    }

    // Warn if debug mode is enabled in production
    if (config.enableDebugMode) {
      errors.push({
        key: 'enableDebugMode',
        message: 'Debug mode is enabled in production',
        severity: 'warning',
      });
    }

    // Check for localhost URLs in production
    if (config.apiBaseUrl.includes('localhost') || config.apiBaseUrl.includes('127.0.0.1')) {
      errors.push({
        key: 'apiBaseUrl',
        message: 'Using localhost URL in production',
        severity: 'error',
      });
    }
  }

  // Validate URL format
  try {
    new URL(config.apiBaseUrl);
  } catch {
    errors.push({
      key: 'apiBaseUrl',
      message: 'Invalid URL format for API base URL',
      severity: 'error',
    });
  }

  return errors;
};

// Run validation and handle results
export const runValidation = () => {
  const errors = validateEnvironment();

  if (errors.length > 0) {
    console.group('🚨 Environment Configuration Issues:');

    const criticalErrors = errors.filter(e => e.severity === 'error');
    const warnings = errors.filter(e => e.severity === 'warning');

    if (criticalErrors.length > 0) {
      console.error('❌ Errors:', criticalErrors);
    }

    if (warnings.length > 0) {
      console.warn('⚠️  Warnings:', warnings);
    }

    console.groupEnd();

    // In production, throw error if there are critical errors
    if (config.environment === 'production' && criticalErrors.length > 0) {
      throw new Error('Critical configuration errors detected. Cannot start app in production.');
    }
  } else if (__DEV__) {
    console.log('✅ Environment configuration validated successfully');
  }
};

// Export for use in other modules
export default { validateEnvironment, runValidation };