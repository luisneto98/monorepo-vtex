import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Environment types
type Environment = 'development' | 'staging' | 'production';

// Configuration interface
interface Config {
  environment: Environment;
  apiBaseUrl: string;
  apiTimeout: number;
  enableDebugMode: boolean;
  sentryDsn?: string;
  googleMapsApiKey?: string;
  appVersion: string;
  buildVersion: string;
}

// Get environment from Expo config
const getEnvironment = (): Environment => {
  const env = Constants.expoConfig?.extra?.environment ||
               Constants.manifest2?.extra?.environment ||
               process.env.NODE_ENV ||
               'development';

  return env as Environment;
};

// Get API base URL based on environment and platform
const getApiBaseUrl = (): string => {
  // First check if we have an explicit URL in Expo config
  const configUrl = Constants.expoConfig?.extra?.apiBaseUrl ||
                   Constants.manifest2?.extra?.apiBaseUrl;

  if (configUrl) {
    return configUrl;
  }

  // Use environment-specific defaults
  const environment = getEnvironment();

  if (environment === 'production') {
    return 'https://api.vtexevents.com/api'; // Replace with actual production URL
  }

  if (environment === 'staging') {
    return 'https://staging-api.vtexevents.com/api'; // Replace with actual staging URL
  }

  // Development defaults per platform
  // Note: process.env doesn't work in Expo - use Constants.expoConfig.extra instead
  const fallbackUrl = Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api' // Android emulator special IP for localhost
    : 'http://localhost:3000/api'; // iOS/Web can use localhost

  return fallbackUrl;
};

// Main configuration object
const config: Config = {
  environment: getEnvironment(),
  apiBaseUrl: getApiBaseUrl(),
  apiTimeout: Constants.expoConfig?.extra?.apiTimeout || 10000, // 10 seconds default
  enableDebugMode: Constants.expoConfig?.extra?.enableDebugMode ?? __DEV__,
  sentryDsn: Constants.expoConfig?.extra?.sentryDsn,
  googleMapsApiKey: Constants.expoConfig?.extra?.googleMapsApiKey,
  appVersion: Constants.expoConfig?.version || '1.0.0',
  buildVersion: Constants.expoConfig?.ios?.buildNumber ||
                Constants.expoConfig?.android?.versionCode?.toString() || '1',
};

// Validate required configuration
const validateConfig = () => {
  const required = ['apiBaseUrl'] as const;
  const missing: string[] = [];

  for (const key of required) {
    if (!config[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required configuration:', missing.join(', '));
    if (!__DEV__) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }

  if (__DEV__) {
    console.log('📱 App Configuration:', {
      environment: config.environment,
      apiBaseUrl: config.apiBaseUrl,
      platform: Platform.OS,
      debugMode: config.enableDebugMode,
    });
  }
};

// Run validation
validateConfig();

// Export configuration
export default config;

// Export specific configs for convenience
export const {
  environment,
  apiBaseUrl,
  apiTimeout,
  enableDebugMode,
  sentryDsn,
  googleMapsApiKey,
  appVersion,
  buildVersion,
} = config;

// Helper functions
export const isDevelopment = () => config.environment === 'development';
export const isStaging = () => config.environment === 'staging';
export const isProduction = () => config.environment === 'production';
export const isDebugMode = () => config.enableDebugMode;