import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService, PushNotificationData } from '../../../src/services/NotificationService';

jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000',
        eas: {
          projectId: 'test-project-id',
        },
      },
      version: '1.0.0',
    },
  },
}));

global.fetch = jest.fn();

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully when permission granted', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        canAskAgain: false,
        expires: 'never',
      } as any);

      jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockResolvedValue({
        data: 'ExponentPushToken[test]',
        type: 'expo',
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, deviceId: 'device-123' }),
      });

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await NotificationService.initialize();

      expect(result).toBe(true);
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false when permission not granted', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'denied' as any,
        granted: false,
        canAskAgain: false,
        expires: 'never',
      } as any);

      const result = await NotificationService.initialize();

      expect(result).toBe(false);
    });

    it('should handle initialization errors', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockRejectedValue(new Error('Init error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await NotificationService.initialize();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getDeviceToken', () => {
    it('should return cached token if available', async () => {
      const cachedToken = 'ExponentPushToken[cached]';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(cachedToken);

      const token = await NotificationService.getDeviceToken();

      expect(token).toBe(cachedToken);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@device_push_token');
    });

    it('should fetch new token if not cached', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockResolvedValue({
        data: 'ExponentPushToken[new]',
        type: 'expo',
      } as any);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const token = await NotificationService.getDeviceToken();

      expect(token).toBe('ExponentPushToken[new]');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@device_push_token', 'ExponentPushToken[new]');
    });

    it('should handle token fetch errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockRejectedValue(new Error('Token error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const token = await NotificationService.getDeviceToken();

      expect(token).toBe(null);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('registerDevice', () => {
    it('should register device successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, deviceId: 'device-456' }),
      });
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await NotificationService.registerDevice('ExponentPushToken[test]');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/notifications/devices/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@device_id', 'device-456');

      consoleLogSpy.mockRestore();
    });

    it('should handle registration errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await NotificationService.registerDevice('ExponentPushToken[test]');

      expect(result).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('parseNotification', () => {
    it('should parse notification correctly', () => {
      const mockNotification: any = {
        date: Date.now(),
        request: {
          identifier: 'notif-123',
          content: {
            title: 'Test Title',
            body: 'Test Body',
            data: {
              type: 'session_update',
              deepLink: 'vtexevents://session/123',
              sessionId: '123',
            },
          },
        },
      };

      const parsed = NotificationService.parseNotification(mockNotification);

      expect(parsed.id).toBe('notif-123');
      expect(parsed.title).toBe('Test Title');
      expect(parsed.message).toBe('Test Body');
      expect(parsed.read).toBe(false);
      expect(parsed.metadata?.type).toBe('session_update');
      expect(parsed.metadata?.deepLink).toBe('vtexevents://session/123');
    });
  });

  describe('getDeepLink', () => {
    it('should return deep link from notification metadata', () => {
      const notification: PushNotificationData = {
        id: '1',
        title: 'Test',
        message: 'Test',
        timestamp: new Date(),
        read: false,
        metadata: {
          deepLink: 'vtexevents://session/123',
        },
      };

      const deepLink = NotificationService.getDeepLink(notification);

      expect(deepLink).toBe('vtexevents://session/123');
    });

    it('should return null if no deep link', () => {
      const notification: PushNotificationData = {
        id: '1',
        title: 'Test',
        message: 'Test',
        timestamp: new Date(),
        read: false,
      };

      const deepLink = NotificationService.getDeepLink(notification);

      expect(deepLink).toBe(null);
    });
  });

  describe('isValidDeepLink', () => {
    it('should validate session deep links', () => {
      expect(NotificationService.isValidDeepLink('vtexevents://session/abc123')).toBe(true);
      expect(NotificationService.isValidDeepLink('vtexevents://session/session-id-123')).toBe(true);
    });

    it('should validate speaker deep links', () => {
      expect(NotificationService.isValidDeepLink('vtexevents://speaker/abc123')).toBe(true);
      expect(NotificationService.isValidDeepLink('vtexevents://speaker/speaker-id-456')).toBe(true);
    });

    it('should reject invalid deep links', () => {
      expect(NotificationService.isValidDeepLink('vtexevents://invalid/path')).toBe(false);
      expect(NotificationService.isValidDeepLink('http://example.com')).toBe(false);
      expect(NotificationService.isValidDeepLink('vtexevents://session/')).toBe(false);
      expect(NotificationService.isValidDeepLink('vtexevents://session/<script>alert(1)</script>')).toBe(false);
    });
  });

  describe('sanitizeNotificationContent', () => {
    it('should remove HTML tags', () => {
      const content = '<p>Hello <strong>World</strong></p>';
      const sanitized = NotificationService.sanitizeNotificationContent(content);

      expect(sanitized).toBe('Hello World');
    });

    it('should truncate long content', () => {
      const content = 'a'.repeat(300);
      const sanitized = NotificationService.sanitizeNotificationContent(content);

      expect(sanitized.length).toBe(243); // 240 + "..."
      expect(sanitized.endsWith('...')).toBe(true);
    });

    it('should handle normal content', () => {
      const content = 'Normal notification message';
      const sanitized = NotificationService.sanitizeNotificationContent(content);

      expect(sanitized).toBe(content);
    });
  });

  describe('badge count', () => {
    it('should get badge count', async () => {
      jest.spyOn(Notifications, 'getBadgeCountAsync').mockResolvedValue(5);

      const count = await NotificationService.getBadgeCount();

      expect(count).toBe(5);
    });

    it('should set badge count', async () => {
      jest.spyOn(Notifications, 'setBadgeCountAsync').mockResolvedValue(true);

      await NotificationService.setBadgeCount(10);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(10);
    });

    it('should handle badge count errors', async () => {
      jest.spyOn(Notifications, 'getBadgeCountAsync').mockRejectedValue(new Error('Badge error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const count = await NotificationService.getBadgeCount();

      expect(count).toBe(0);

      consoleErrorSpy.mockRestore();
    });
  });
});