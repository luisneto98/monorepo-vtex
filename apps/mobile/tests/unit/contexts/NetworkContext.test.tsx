import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { NetworkProvider, useNetwork } from '../../../src/contexts/NetworkContext';

// Mock NetInfo
jest.mock('@react-native-community/netinfo');

describe('NetworkContext', () => {
  let mockNetworkListener: ((state: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNetworkListener = null;

    // Mock NetInfo.addEventListener
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      mockNetworkListener = callback;
      return jest.fn(); // Return unsubscribe function
    });

    // Default mock for NetInfo.fetch
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
  });

  describe('NetworkProvider', () => {
    it('should initialize with network state from NetInfo.fetch', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { result } = renderHook(() => useNetwork(), { wrapper });

      await waitFor(() => {
        expect(result.current.connectionType).toBe('wifi');
      }, { timeout: 3000 });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
    });

    it('should update state when network changes to offline', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { result } = renderHook(() => useNetwork(), { wrapper });

      // Wait for initial state
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 3000 });

      // Simulate network disconnection
      expect(mockNetworkListener).not.toBeNull();
      act(() => {
        mockNetworkListener!({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        });
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.connectionType).toBe('none');
    });

    it('should update state when network changes to online', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { result } = renderHook(() => useNetwork(), { wrapper });

      // Wait for initial offline state
      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      }, { timeout: 3000 });

      // Simulate network reconnection
      expect(mockNetworkListener).not.toBeNull();
      act(() => {
        mockNetworkListener!({
          isConnected: true,
          isInternetReachable: true,
          type: 'cellular',
        });
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.connectionType).toBe('cellular');
    });

    it('should handle null isConnected from NetInfo', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: null,
        isInternetReachable: null,
        type: 'unknown',
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { result } = renderHook(() => useNetwork(), { wrapper });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false); // null coalesces to false
      }, { timeout: 3000 });

      expect(result.current.isInternetReachable).toBeNull();
      expect(result.current.connectionType).toBe('unknown');
    });

    it('should unsubscribe from NetInfo on unmount', async () => {
      const unsubscribeMock = jest.fn();
      (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribeMock);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { unmount } = renderHook(() => useNetwork(), { wrapper });

      await waitFor(() => {
        expect(NetInfo.addEventListener).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('useNetwork hook', () => {
    it('should throw error when used outside NetworkProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useNetwork());
      }).toThrow('useNetwork must be used within a NetworkProvider');

      consoleError.mockRestore();
    });

    it('should provide network context data', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { result } = renderHook(() => useNetwork(), { wrapper });

      await waitFor(() => {
        expect(result.current).toHaveProperty('isConnected');
      }, { timeout: 3000 });

      expect(result.current).toHaveProperty('isInternetReachable');
      expect(result.current).toHaveProperty('connectionType');
    });
  });

  describe('connection type tracking', () => {
    it('should track wifi connection', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { result } = renderHook(() => useNetwork(), { wrapper });

      await waitFor(() => {
        expect(result.current.connectionType).toBe('wifi');
      }, { timeout: 3000 });
    });

    it('should track cellular connection', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'cellular',
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { result } = renderHook(() => useNetwork(), { wrapper });

      await waitFor(() => {
        expect(result.current.connectionType).toBe('cellular');
      }, { timeout: 3000 });
    });

    it('should track connection type changes', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworkProvider>{children}</NetworkProvider>
      );

      const { result } = renderHook(() => useNetwork(), { wrapper });

      // Initial wifi connection
      await waitFor(() => {
        expect(result.current.connectionType).toBe('wifi');
      }, { timeout: 3000 });

      // Switch to cellular
      expect(mockNetworkListener).not.toBeNull();
      act(() => {
        mockNetworkListener!({
          isConnected: true,
          isInternetReachable: true,
          type: 'cellular',
        });
      });

      await waitFor(() => {
        expect(result.current.connectionType).toBe('cellular');
      }, { timeout: 3000 });
    });
  });
});