import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_TOKEN_KEY = '@device_push_token';
const DEVICE_ID_KEY = '@device_id';

export interface DeviceRegistrationPayload {
  token: string;
  platform: 'ios' | 'android';
  appVersion?: string;
  isTestDevice: boolean;
}

export interface PushNotificationData {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: {
    type?: 'session_update' | 'general' | 'reminder';
    deepLink?: string;
    sessionId?: string;
    speakerId?: string;
  };
}

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Service for handling push notifications
 */
export class NotificationService {
  private static notificationListenerSubscription: Notifications.Subscription | null = null;
  private static responseListenerSubscription: Notifications.Subscription | null = null;

  /**
   * Initialize notification service and register device token
   */
  static async initialize(): Promise<boolean> {
    try {
      // Check if we have permission
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // Get device token
      const token = await this.getDeviceToken();

      if (!token) {
        console.log('Failed to get device token');
        return false;
      }

      // Register device with backend
      await this.registerDevice(token);

      // Setup notification channel for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  /**
   * Get Expo push token for this device
   */
  static async getDeviceToken(): Promise<string | null> {
    try {
      // Skip push notifications on web for now (VAPID not configured)
      if (Platform.OS === 'web') {
        console.warn('Push notifications not supported on web (VAPID key not configured)');
        return null;
      }

      // Check if we have a cached token
      const cachedToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);

      if (cachedToken) {
        return cachedToken;
      }

      // Get project ID from expo config
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

      // Get new token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;

      // Cache the token
      await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);

      return token;
    } catch (error) {
      console.error('Error getting device token:', error);
      return null;
    }
  }

  /**
   * Register device with backend
   */
  static async registerDevice(token: string): Promise<boolean> {
    try {
      const apiUrl = Constants?.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
      const appVersion = Constants?.expoConfig?.version || '1.0.0';

      const payload: DeviceRegistrationPayload = {
        token,
        platform: Platform.OS as 'ios' | 'android',
        appVersion,
        isTestDevice: __DEV__,
      };

      const response = await fetch(`${apiUrl}/notifications/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Device registration failed: ${response.status}`);
      }

      const result = await response.json();

      // Store device ID
      if (result.deviceId) {
        await AsyncStorage.setItem(DEVICE_ID_KEY, result.deviceId);
      }

      console.log('Device registered successfully:', result.deviceId);
      return true;
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
  }

  /**
   * Setup Android notification channel
   */
  static async setupAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F71963',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }
  }

  /**
   * Setup notification listeners
   */
  static setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ): void {
    // Listener for notifications received while app is in foreground
    this.notificationListenerSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Listener for when user taps a notification
    this.responseListenerSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );
  }

  /**
   * Remove notification listeners
   */
  static removeListeners(): void {
    if (this.notificationListenerSubscription) {
      this.notificationListenerSubscription.remove();
      this.notificationListenerSubscription = null;
    }

    if (this.responseListenerSubscription) {
      this.responseListenerSubscription.remove();
      this.responseListenerSubscription = null;
    }
  }

  /**
   * Parse notification into our data format
   */
  static parseNotification(notification: Notifications.Notification): PushNotificationData {
    const { request } = notification;
    const { content } = request;

    return {
      id: request.identifier,
      title: content.title || '',
      message: content.body || '',
      timestamp: new Date(notification.date),
      read: false,
      metadata: content.data as PushNotificationData['metadata'],
    };
  }

  /**
   * Parse notification response (when tapped)
   */
  static parseNotificationResponse(response: Notifications.NotificationResponse): PushNotificationData {
    return this.parseNotification(response.notification);
  }

  /**
   * Get deep link from notification
   */
  static getDeepLink(notification: PushNotificationData): string | null {
    return notification.metadata?.deepLink || null;
  }

  /**
   * Validate deep link format
   */
  static isValidDeepLink(deepLink: string): boolean {
    // Whitelist allowed patterns
    const allowedPatterns = [
      /^vtexevents:\/\/session\/[a-zA-Z0-9-]+$/,
      /^vtexevents:\/\/speaker\/[a-zA-Z0-9-]+$/,
    ];

    return allowedPatterns.some((pattern) => pattern.test(deepLink));
  }

  /**
   * Sanitize notification content
   */
  static sanitizeNotificationContent(content: string): string {
    // Remove any HTML tags
    const sanitized = content.replace(/<[^>]*>/g, '');

    // Limit length
    const maxLength = 240;
    if (sanitized.length > maxLength) {
      return sanitized.substring(0, maxLength) + '...';
    }

    return sanitized;
  }

  /**
   * Get badge count
   */
  static async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Dismiss specific notification
   */
  static async dismissNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }
}