import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { EventSettings } from '@monorepo-vtex/shared/types/event-settings';
import { EventSettingsService, EventSettingsServiceError } from '../services/EventSettingsService';

interface EventSettingsContextData {
  eventSettings: EventSettings | null;
  loading: boolean;
  error: EventSettingsServiceError | null;
  refresh: () => Promise<void>;
  getLocalizedEventName: (locale?: string) => string;
}

const EventSettingsContext = createContext<EventSettingsContextData | undefined>(undefined);

interface EventSettingsProviderProps {
  children: ReactNode;
}

export const EventSettingsProvider: React.FC<EventSettingsProviderProps> = ({ children }) => {
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<EventSettingsServiceError | null>(null);

  /**
   * Load event settings on mount
   * Uses stale-while-revalidate: shows cached data immediately, fetches fresh in background
   */
  const loadEventSettings = useCallback(async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const data = await EventSettingsService.fetchEventSettings(true);
      setEventSettings(data);
    } catch (err: any) {
      console.error('Error loading event settings:', err);
      setError(err as EventSettingsServiceError);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Force refresh event settings (pull-to-refresh)
   * Clears cache and fetches fresh data
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await EventSettingsService.refreshEventSettings();
      setEventSettings(data);
    } catch (err: any) {
      console.error('Error refreshing event settings:', err);
      setError(err as EventSettingsServiceError);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get localized event name based on device locale
   */
  const getLocalizedEventName = useCallback(
    (locale?: string): string => {
      if (!eventSettings) {
        return '';
      }
      return EventSettingsService.getLocalizedEventName(eventSettings, locale);
    },
    [eventSettings]
  );

  // Load event settings on mount
  useEffect(() => {
    loadEventSettings();
  }, [loadEventSettings]);

  return (
    <EventSettingsContext.Provider
      value={{
        eventSettings,
        loading,
        error,
        refresh,
        getLocalizedEventName,
      }}
    >
      {children}
    </EventSettingsContext.Provider>
  );
};

/**
 * Custom hook to access event settings context
 * Must be used within EventSettingsProvider
 */
export const useEventSettings = (): EventSettingsContextData => {
  const context = useContext(EventSettingsContext);

  if (!context) {
    throw new Error('useEventSettings must be used within an EventSettingsProvider');
  }

  return context;
};