# Environment Configuration Guide

## Overview
This app uses environment variables for configuration across different environments (development, staging, production).

## Setup

### 1. Create your .env file
```bash
cp .env.example .env
```

### 2. Update the values in .env
```bash
# Development Environment Configuration
API_BASE_URL=http://localhost:3001/api  # Your API URL
API_TIMEOUT=10000                       # Request timeout in milliseconds
ENVIRONMENT=development                 # development | staging | production
ENABLE_DEBUG_MODE=true                  # Enable debug logs
```

## Configuration Files

### `.env` - Local development
- Not committed to git
- Contains your local development settings
- Override default values for your environment

### `.env.example` - Template
- Committed to git
- Shows all available environment variables
- Used as reference for new developers

### `app.config.js` - Expo configuration
- Reads from .env files
- Exposes variables to the app via Constants.expoConfig.extra

### `src/config/env.ts` - Runtime configuration
- Central configuration module
- Platform-specific defaults
- Type-safe configuration access

## Available Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_BASE_URL` | Yes | Platform-specific | API endpoint URL |
| `API_TIMEOUT` | No | 10000 | API request timeout (ms) |
| `ENVIRONMENT` | No | development | App environment |
| `ENABLE_DEBUG_MODE` | No | true (dev) | Enable debug logging |
| `SENTRY_DSN` | No | - | Sentry error tracking |
| `GOOGLE_MAPS_API_KEY` | No | - | Google Maps integration |

## Platform-Specific Defaults

When `API_BASE_URL` is not set, the app uses platform defaults:

- **iOS Simulator**: `http://localhost:3001/api`
- **Android Emulator**: `http://10.0.2.2:3001/api`
- **Web**: `http://localhost:3001/api`

## Environment Detection

The app determines the environment in this order:
1. `ENVIRONMENT` variable in .env
2. `NODE_ENV` environment variable
3. Default to 'development'

## Validation

The app validates configuration on startup:
- Required variables must be present
- Production URLs cannot be localhost
- Debug mode warns if enabled in production

## Usage in Code

```typescript
import config from '@/config/env';

// Access configuration
console.log(config.apiBaseUrl);
console.log(config.environment);

// Use helper functions
import { isDevelopment, isProduction } from '@/config/env';

if (isDevelopment()) {
  // Development only code
}
```

## Building for Different Environments

### Development
```bash
npm start
```

### Staging
```bash
ENVIRONMENT=staging npm start
```

### Production
Create `.env.production`:
```bash
API_BASE_URL=https://api.vtexevents.com/api
ENVIRONMENT=production
ENABLE_DEBUG_MODE=false
```

Then build:
```bash
expo build:ios
expo build:android
```

## Troubleshooting

### Variables not updating
1. Clear Metro cache: `npx expo start --clear`
2. Restart the development server
3. Check that .env file is in the app root

### Platform-specific issues
- Android emulator: Use `10.0.2.2` instead of `localhost`
- iOS simulator: Can use `localhost` directly
- Physical devices: Use your machine's IP address

### Validation errors
Check the console for validation messages on app startup.
Critical errors in production will prevent app from starting.