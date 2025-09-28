import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventSettings } from '../useEventSettings';
import { eventSettingsService } from '@/services/event-settings.service';

jest.mock('@/services/event-settings.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useEventSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches event settings', async () => {
    const mockSettings = {
      eventName: { pt: 'VTEX Day', en: 'VTEX Day', es: 'VTEX Day' },
      startDate: '2026-06-15',
      endDate: '2026-06-16',
    };

    (eventSettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);

    const { result } = renderHook(() => useEventSettings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSettings);
  });

  it('handles update mutation', async () => {
    const mockSettings = {
      eventName: { pt: 'VTEX Day Updated', en: 'VTEX Day Updated', es: 'VTEX Day Updated' },
    };

    (eventSettingsService.updateSettings as jest.Mock).mockResolvedValue(mockSettings);

    const { result } = renderHook(() => useEventSettings(), {
      wrapper: createWrapper(),
    });

    result.current.updateSettings(mockSettings as any);

    await waitFor(() => {
      expect(eventSettingsService.updateSettings).toHaveBeenCalledWith(mockSettings);
    });
  });
});