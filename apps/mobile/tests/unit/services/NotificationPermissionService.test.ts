import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationPermissionService } from '../../../src/services/NotificationPermissionService';

jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');

describe('NotificationPermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('should request permissions when not granted and can ask again', async () => {
      const mockGetPermissions = jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'undetermined' as any,
        canAskAgain: true,
        granted: false,
        expires: 'never',
      } as any);

      const mockRequestPermissions = jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue({
        status: 'granted' as any,
        canAskAgain: false,
        granted: true,
        expires: 'never',
      } as any);

      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await NotificationPermissionService.requestPermissions();

      expect(result.status).toBe('granted');
      expect(mockGetPermissions).toHaveBeenCalled();
      expect(mockRequestPermissions).toHaveBeenCalledWith({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@notification_permission_status', 'granted');
    });

    it('should return existing status if already granted', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'granted' as any,
        canAskAgain: false,
        granted: true,
        expires: 'never',
      } as any);

      const mockRequestPermissions = jest.spyOn(Notifications, 'requestPermissionsAsync');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await NotificationPermissionService.requestPermissions();

      expect(result.status).toBe('granted');
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('should not request if cannot ask again', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'denied' as any,
        canAskAgain: false,
        granted: false,
        expires: 'never',
      } as any);

      const mockRequestPermissions = jest.spyOn(Notifications, 'requestPermissionsAsync');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await NotificationPermissionService.requestPermissions();

      expect(result.status).toBe('denied');
      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockRejectedValue(new Error('Permission error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await NotificationPermissionService.requestPermissions();

      expect(result.status).toBe('denied');
      expect(result.canAskAgain).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error requesting notification permissions:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkPermissionStatus', () => {
    it('should return granted status', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'granted' as any,
        canAskAgain: false,
        granted: true,
        expires: 'never',
      } as any);

      const result = await NotificationPermissionService.checkPermissionStatus();

      expect(result.status).toBe('granted');
      expect(result.canAskAgain).toBe(false);
    });

    it('should return denied status', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'denied' as any,
        canAskAgain: false,
        granted: false,
        expires: 'never',
      } as any);

      const result = await NotificationPermissionService.checkPermissionStatus();

      expect(result.status).toBe('denied');
      expect(result.canAskAgain).toBe(false);
    });

    it('should handle errors and return undetermined', async () => {
      jest.spyOn(Notifications, 'getPermissionsAsync').mockRejectedValue(new Error('Check error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await NotificationPermissionService.checkPermissionStatus();

      expect(result.status).toBe('undetermined');
      expect(result.canAskAgain).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getStoredPermissionStatus', () => {
    it('should return stored status', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('granted');

      const status = await NotificationPermissionService.getStoredPermissionStatus();

      expect(status).toBe('granted');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@notification_permission_status');
    });

    it('should return undetermined if no stored status', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const status = await NotificationPermissionService.getStoredPermissionStatus();

      expect(status).toBe('undetermined');
    });

    it('should handle errors and return undetermined', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const status = await NotificationPermissionService.getStoredPermissionStatus();

      expect(status).toBe('undetermined');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('storePermissionStatus', () => {
    it('should store permission status', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await NotificationPermissionService.storePermissionStatus('granted');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@notification_permission_status', 'granted');
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await NotificationPermissionService.storePermissionStatus('granted');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error storing permission status:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('shouldShowPermissionRequest', () => {
    it('should return false if already granted', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('granted');

      const shouldShow = await NotificationPermissionService.shouldShowPermissionRequest();

      expect(shouldShow).toBe(false);
    });

    it('should return true if undetermined and can ask again', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('undetermined');
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'undetermined' as any,
        canAskAgain: true,
        granted: false,
        expires: 'never',
      } as any);

      const shouldShow = await NotificationPermissionService.shouldShowPermissionRequest();

      expect(shouldShow).toBe(true);
    });

    it('should return false if denied and cannot ask again', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('denied');
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        status: 'denied' as any,
        canAskAgain: false,
        granted: false,
        expires: 'never',
      } as any);

      const shouldShow = await NotificationPermissionService.shouldShowPermissionRequest();

      expect(shouldShow).toBe(false);
    });
  });
});