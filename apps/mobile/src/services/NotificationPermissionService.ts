import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PERMISSION_STATUS_KEY = '@notification_permission_status';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface NotificationPermissionResult {
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
}

/**
 * Service for managing notification permissions
 */
export class NotificationPermissionService {
  /**
   * Request notification permissions from the user
   * @returns Promise with permission result
   */
  static async requestPermissions(): Promise<NotificationPermissionResult> {
    try {
      const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      // Only ask if we haven't asked before or if we can ask again
      if (existingStatus !== 'granted' && canAskAgain) {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      const permissionStatus = this.mapToPermissionStatus(finalStatus);

      // Store permission status
      await this.storePermissionStatus(permissionStatus);

      return {
        status: permissionStatus,
        canAskAgain,
      };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return {
        status: 'denied',
        canAskAgain: false,
      };
    }
  }

  /**
   * Check current notification permission status
   * @returns Current permission status
   */
  static async checkPermissionStatus(): Promise<NotificationPermissionResult> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      const permissionStatus = this.mapToPermissionStatus(status);

      return {
        status: permissionStatus,
        canAskAgain,
      };
    } catch (error) {
      console.error('Error checking permission status:', error);
      return {
        status: 'undetermined',
        canAskAgain: true,
      };
    }
  }

  /**
   * Get stored permission status from AsyncStorage
   * @returns Stored permission status or undetermined
   */
  static async getStoredPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const status = await AsyncStorage.getItem(PERMISSION_STATUS_KEY);
      return (status as NotificationPermissionStatus) || 'undetermined';
    } catch (error) {
      console.error('Error getting stored permission status:', error);
      return 'undetermined';
    }
  }

  /**
   * Store permission status in AsyncStorage
   * @param status Permission status to store
   */
  static async storePermissionStatus(status: NotificationPermissionStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSION_STATUS_KEY, status);
    } catch (error) {
      console.error('Error storing permission status:', error);
    }
  }

  /**
   * Check if we should show permission request (not asked before or can ask again)
   * @returns True if we should show the permission request
   */
  static async shouldShowPermissionRequest(): Promise<boolean> {
    const storedStatus = await this.getStoredPermissionStatus();
    if (storedStatus === 'granted') {
      return false;
    }

    const { status, canAskAgain } = await this.checkPermissionStatus();
    return status !== 'granted' && canAskAgain;
  }

  /**
   * Open app settings (for when permission is denied and user wants to enable)
   * Note: This is a placeholder - actual implementation requires expo-intent-launcher on Android
   * or Linking.openSettings() on iOS
   */
  static async openAppSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      // On iOS, we can't directly open settings, user needs to do it manually
      console.log('Please open Settings app and enable notifications for VTEX Events');
    } else {
      // On Android, we could use expo-intent-launcher
      console.log('Please open app settings and enable notifications');
    }
  }

  /**
   * Map Expo permission status to our simplified status
   */
  private static mapToPermissionStatus(
    status: Notifications.PermissionStatus
  ): NotificationPermissionStatus {
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    } else {
      return 'undetermined';
    }
  }
}