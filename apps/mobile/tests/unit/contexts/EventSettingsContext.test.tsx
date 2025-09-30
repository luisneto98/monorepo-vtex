import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { EventSettingsProvider, useEventSettings } from '../../../src/contexts/EventSettingsContext';
import { EventSettingsService } from '../../../src/services/EventSettingsService';
import { EventSettings } from '@monorepo-vtex/shared/types/event-settings';

// Mock the service
jest.mock('../../../src/services/EventSettingsService');

const mockEventSettings: EventSettings = {
  _id: '123',
  eventName: {
    pt: 'Evento Teste',
    en: 'Test Event',
    es: 'Evento de Prueba',
  },
  startDate: '2025-09-25T10:00:00Z',
  endDate: '2025-09-27T18:00:00Z',
  venue: {
    name: 'Centro de Convenções',
    address: 'Rua Teste, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
  },
  contact: {
    email: 'contato@evento.com',
    phone: '+5511987654321',
  },
  mapCoordinates: {
    latitude: -23.5505,
    longitude: -46.6333,
  },
};

describe('EventSettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EventSettingsProvider>{children}</EventSettingsProvider>
  );

  it('should initialize with loading state', () => {
    // Arrange
    (EventSettingsService.fetchEventSettings as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Act
    const { result } = renderHook(() => useEventSettings(), { wrapper });

    // Assert
    expect(result.current.loading).toBe(true);
    expect(result.current.eventSettings).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load event settings successfully', async () => {
    // Arrange
    (EventSettingsService.fetchEventSettings as jest.Mock).mockResolvedValue(mockEventSettings);

    // Act
    const { result } = renderHook(() => useEventSettings(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.eventSettings).toEqual(mockEventSettings);
    expect(result.current.error).toBeNull();
    expect(EventSettingsService.fetchEventSettings).toHaveBeenCalledWith(true);
  });

  it('should handle fetch error', async () => {
    // Arrange
    const mockError = {
      message: 'Network error',
      code: 'NETWORK_ERROR' as const,
    };
    (EventSettingsService.fetchEventSettings as jest.Mock).mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useEventSettings(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.eventSettings).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('should refresh event settings', async () => {
    // Arrange
    (EventSettingsService.fetchEventSettings as jest.Mock).mockResolvedValue(mockEventSettings);
    (EventSettingsService.refreshEventSettings as jest.Mock).mockResolvedValue({
      ...mockEventSettings,
      eventName: {
        pt: 'Evento Atualizado',
        en: 'Updated Event',
        es: 'Evento Actualizado',
      },
    });

    // Act
    const { result } = renderHook(() => useEventSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refresh
    await act(async () => {
      await result.current.refresh();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.eventSettings?.eventName.pt).toBe('Evento Atualizado');
    expect(EventSettingsService.refreshEventSettings).toHaveBeenCalled();
  });

  it('should handle refresh error', async () => {
    // Arrange
    (EventSettingsService.fetchEventSettings as jest.Mock).mockResolvedValue(mockEventSettings);
    const refreshError = {
      message: 'Refresh failed',
      code: 'NETWORK_ERROR' as const,
    };
    (EventSettingsService.refreshEventSettings as jest.Mock).mockRejectedValue(refreshError);

    // Act
    const { result } = renderHook(() => useEventSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refresh
    await act(async () => {
      await result.current.refresh();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(refreshError);
  });

  it('should provide localized event name', async () => {
    // Arrange
    (EventSettingsService.fetchEventSettings as jest.Mock).mockResolvedValue(mockEventSettings);
    (EventSettingsService.getLocalizedEventName as jest.Mock).mockReturnValue('Test Event');

    // Act
    const { result } = renderHook(() => useEventSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const localizedName = result.current.getLocalizedEventName('en');

    // Assert
    expect(localizedName).toBe('Test Event');
    expect(EventSettingsService.getLocalizedEventName).toHaveBeenCalledWith(
      mockEventSettings,
      'en'
    );
  });

  it('should return empty string when no event settings available', async () => {
    // Arrange
    (EventSettingsService.fetchEventSettings as jest.Mock).mockRejectedValue({
      message: 'Error',
      code: 'NETWORK_ERROR',
    });

    // Act
    const { result } = renderHook(() => useEventSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const localizedName = result.current.getLocalizedEventName('en');

    // Assert
    expect(localizedName).toBe('');
  });

  it('should throw error when used outside provider', () => {
    // Arrange & Act
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Assert
    expect(() => {
      renderHook(() => useEventSettings());
    }).toThrow('useEventSettings must be used within an EventSettingsProvider');

    consoleError.mockRestore();
  });
});