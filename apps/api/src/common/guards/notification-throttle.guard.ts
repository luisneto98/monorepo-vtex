import { Injectable, ExecutionContext, HttpException, HttpStatus, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NOTIFICATION_THROTTLE_KEY, NotificationThrottleOptions } from '../decorators/notification-throttle.decorator';

interface ThrottleRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class NotificationThrottleGuard implements CanActivate {
  private readonly throttleStore = new Map<string, ThrottleRecord>();

  constructor(private readonly reflector: Reflector) {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const throttleOptions = this.reflector.get<NotificationThrottleOptions>(
      NOTIFICATION_THROTTLE_KEY,
      context.getHandler(),
    );

    if (!throttleOptions) {
      // No notification throttle decorator, skip this guard
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request['user']?.userId;

    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const key = `notification_throttle:${userId}`;
    const { ttl, limit } = throttleOptions;
    const now = Date.now();

    let record = this.throttleStore.get(key);

    // Initialize or reset if expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + ttl,
      };
      this.throttleStore.set(key, record);
    }

    // Check if limit exceeded
    if (record.count >= limit) {
      const remainingTime = Math.ceil((record.resetTime - now) / 1000);
      throw new HttpException(
        `Notification rate limit exceeded. Try again in ${remainingTime} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    record.count++;
    this.throttleStore.set(key, record);

    return true;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, record] of this.throttleStore.entries()) {
      if (now > record.resetTime) {
        this.throttleStore.delete(key);
      }
    }
  }
}