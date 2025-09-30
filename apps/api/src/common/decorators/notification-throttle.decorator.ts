import { SetMetadata } from '@nestjs/common';

export const NOTIFICATION_THROTTLE_KEY = 'notification_throttle';

export interface NotificationThrottleOptions {
  ttl: number; // Time to live in milliseconds
  limit: number; // Max requests per TTL
}

export const NotificationThrottle = (options: NotificationThrottleOptions) =>
  SetMetadata(NOTIFICATION_THROTTLE_KEY, options);