// app.config.js - Dynamic configuration with environment variables
import 'dotenv/config';

export default {
  expo: {
    name: 'VTEX Events',
    slug: 'vtex-events',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'vtexevents',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.vtex.events',
      buildNumber: '1'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: true,
      package: 'com.vtex.events',
      versionCode: 1
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro'
    },
    plugins: [
      'expo-splash-screen'
    ],
    // Extra configuration accessible via Constants.expoConfig.extra
    extra: {
      // Environment variables
      environment: process.env.ENVIRONMENT || 'development',
      apiBaseUrl: process.env.API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
      apiTimeout: parseInt(process.env.API_TIMEOUT || '10000', 10),
      enableDebugMode: process.env.ENABLE_DEBUG_MODE === 'true',

      // Optional services
      sentryDsn: process.env.SENTRY_DSN || undefined,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || undefined,

      // Feature flags
      enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
      enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',

      // EAS Build Configuration
      eas: {
        projectId: process.env.EAS_PROJECT_ID || undefined
      }
    }
  }
};