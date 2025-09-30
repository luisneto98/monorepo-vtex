import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PushNotificationData, NotificationService } from '../services/NotificationService';

const NOTIFICATIONS_STORAGE_KEY = '@notifications_unread';

interface NotificationContextData {
  unreadCount: number;
  notifications: PushNotificationData[];
  addNotification: (notification: PushNotificationData) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<PushNotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    // Update unread count when notifications change
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);

    // Update badge count on device
    NotificationService.setBadgeCount(unread);
  }, [notifications]);

  const loadNotifications = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const notificationsWithDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(notificationsWithDates);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async (notifs: PushNotificationData[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const addNotification = async (notification: PushNotificationData): Promise<void> => {
    try {
      // Check if notification already exists
      const exists = notifications.some((n) => n.id === notification.id);
      if (exists) {
        return;
      }

      const updatedNotifications = [notification, ...notifications];

      // Limit to 50 most recent notifications
      const limitedNotifications = updatedNotifications.slice(0, 50);

      setNotifications(limitedNotifications);
      await saveNotifications(limitedNotifications);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      const updatedNotifications = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );

      setNotifications(updatedNotifications);
      await saveNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));

      setNotifications(updatedNotifications);
      await saveNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      setNotifications([]);
      await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      await NotificationService.clearAllNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextData => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
};