import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationProvider, useNotifications } from '../../../src/contexts/NotificationContext';
import { NotificationService, PushNotificationData } from '../../../src/services/NotificationService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../src/services/NotificationService');

describe('NotificationContext', () => {
  const mockNotification: PushNotificationData = {
    id: 'notif-1',
    title: 'Test Notification',
    message: 'Test message',
    timestamp: new Date('2025-01-01T10:00:00Z'),
    read: false,
    metadata: {
      type: 'general',
    },
  };

  const mockNotification2: PushNotificationData = {
    id: 'notif-2',
    title: 'Second Notification',
    message: 'Second message',
    timestamp: new Date('2025-01-01T11:00:00Z'),
    read: false,
    metadata: {
      type: 'session_update',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (NotificationService.setBadgeCount as jest.Mock).mockImplementation(() => {});
    (NotificationService.clearAllNotifications as jest.Mock).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  describe('NotificationProvider', () => {
    it('should initialize with empty notifications', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
        expect(result.current.unreadCount).toBe(0);
      });
    });

    it('should load notifications from AsyncStorage on mount', async () => {
      const storedNotifications = [
        { ...mockNotification, timestamp: mockNotification.timestamp.toISOString() },
        { ...mockNotification2, timestamp: mockNotification2.timestamp.toISOString() },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedNotifications));

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.unreadCount).toBe(2);
        expect(result.current.notifications[0].id).toBe('notif-1');
      });
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      });
    });
  });

  describe('addNotification', () => {
    it('should add new notification to the list', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.addNotification(mockNotification);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      }, { timeout: 3000 });

      expect(result.current.notifications[0].id).toBe('notif-1');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications_unread',
        expect.stringContaining('"id":"notif-1"')
      );
    });

    it('should add notifications to the beginning of the list', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.addNotification(mockNotification);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.addNotification(mockNotification2);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      }, { timeout: 3000 });

      expect(result.current.notifications[0].id).toBe('notif-2'); // Most recent first
      expect(result.current.notifications[1].id).toBe('notif-1');
    });

    it('should not add duplicate notifications', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.addNotification(mockNotification);
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.addNotification(mockNotification); // Duplicate
      });

      // Wait a bit to ensure no update happened
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.notifications).toHaveLength(1);
    });

    it('should limit notifications to 50 most recent', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      }, { timeout: 3000 });

      // Add 51 notifications
      for (let i = 0; i < 51; i++) {
        await act(async () => {
          await result.current.addNotification({
            ...mockNotification,
            id: `notif-${i}`,
          });
        });
      }

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(50);
      }, { timeout: 5000 });

      expect(result.current.notifications[0].id).toBe('notif-50'); // Most recent
      expect(result.current.notifications[49].id).toBe('notif-1'); // Oldest kept
    });
  });

  describe('markAsRead', () => {
    it('should mark specific notification as read', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([{ ...mockNotification, timestamp: mockNotification.timestamp.toISOString() }])
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      await waitFor(() => {
        expect(result.current.notifications[0].read).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.unreadCount).toBe(0);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should not affect other notifications', async () => {
      const storedNotifications = [
        { ...mockNotification, timestamp: mockNotification.timestamp.toISOString() },
        { ...mockNotification2, timestamp: mockNotification2.timestamp.toISOString() },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedNotifications));

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      await waitFor(() => {
        const notif1 = result.current.notifications.find(n => n.id === 'notif-1');
        expect(notif1?.read).toBe(true); // notif-1 marked as read
      }, { timeout: 3000 });

      const notif2 = result.current.notifications.find(n => n.id === 'notif-2');
      expect(notif2?.read).toBe(false); // notif-2 still unread
      expect(result.current.unreadCount).toBe(1);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const storedNotifications = [
        { ...mockNotification, timestamp: mockNotification.timestamp.toISOString() },
        { ...mockNotification2, timestamp: mockNotification2.timestamp.toISOString() },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedNotifications));

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      await waitFor(() => {
        expect(result.current.notifications.every((n) => n.read)).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.unreadCount).toBe(0);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('clearAllNotifications', () => {
    it('should clear all notifications', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([{ ...mockNotification, timestamp: mockNotification.timestamp.toISOString() }])
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.clearAllNotifications();
      });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      }, { timeout: 3000 });

      expect(result.current.unreadCount).toBe(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@notifications_unread');
      expect(NotificationService.clearAllNotifications).toHaveBeenCalled();
    });
  });

  describe('unread count tracking', () => {
    it('should update badge count when notifications change', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.addNotification(mockNotification);
      });

      await waitFor(() => {
        expect(NotificationService.setBadgeCount).toHaveBeenCalledWith(1);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.addNotification(mockNotification2);
      });

      await waitFor(() => {
        expect(NotificationService.setBadgeCount).toHaveBeenCalledWith(2);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      await waitFor(() => {
        expect(NotificationService.setBadgeCount).toHaveBeenCalledWith(1);
      }, { timeout: 3000 });
    });

    it('should calculate unread count correctly', async () => {
      const storedNotifications = [
        { ...mockNotification, read: false, timestamp: mockNotification.timestamp.toISOString() },
        { ...mockNotification2, read: true, timestamp: mockNotification2.timestamp.toISOString() },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedNotifications));

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1); // Only notif-1 is unread
      }, { timeout: 3000 });
    });
  });

  describe('useNotifications hook', () => {
    it('should throw error when used outside NotificationProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useNotifications());
      }).toThrow('useNotifications must be used within a NotificationProvider');

      consoleError.mockRestore();
    });

    it('should provide notification context data', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current).toHaveProperty('unreadCount');
      }, { timeout: 3000 });

      expect(result.current).toHaveProperty('notifications');
      expect(result.current).toHaveProperty('addNotification');
      expect(result.current).toHaveProperty('markAsRead');
      expect(result.current).toHaveProperty('markAllAsRead');
      expect(result.current).toHaveProperty('clearAllNotifications');
      expect(result.current).toHaveProperty('loadNotifications');
    });
  });

  describe('loadNotifications', () => {
    it('should reload notifications from storage', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      }, { timeout: 3000 });

      // Update storage
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([{ ...mockNotification, timestamp: mockNotification.timestamp.toISOString() }])
      );

      await act(async () => {
        await result.current.loadNotifications();
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      }, { timeout: 3000 });

      expect(result.current.notifications[0].id).toBe('notif-1');
    });
  });

  describe('persistence', () => {
    it('should persist notifications after adding', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.addNotification(mockNotification);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@notifications_unread',
          expect.any(String)
        );
      }, { timeout: 3000 });

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('notif-1');
    });

    it('should persist notifications after marking as read', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify([{ ...mockNotification, timestamp: mockNotification.timestamp.toISOString() }])
      );

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      }, { timeout: 3000 });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      }, { timeout: 3000 });

      const savedData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData[0].read).toBe(true);
    });
  });
});