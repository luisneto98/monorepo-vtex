// Use our custom implementation to avoid import issues
// @ts-ignore
import { create, devtools, persist, createJSONStorage } from './createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISession } from '../../../../packages/shared/src/types/session.types';
import { Speaker } from '../../../../packages/shared/src/types/speaker.types';
import { HomeData } from '../services/HomeService';

interface AppState {
  // User state
  user: any | null;
  isAuthenticated: boolean;

  // App state
  isLoading: boolean;
  error: string | null;

  // Home state
  homeData: HomeData | null;
  homeLoading: boolean;
  homeError: string | null;
  lastHomeFetch: number | null;

  // Actions
  setUser: (user: any) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Home actions
  setHomeData: (data: HomeData) => void;
  setHomeLoading: (loading: boolean) => void;
  setHomeError: (error: string | null) => void;
  clearHomeError: () => void;
  updateLastHomeFetch: () => void;
  isHomeCacheValid: () => boolean;
}

export const useStore = create((set: any, get: any) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Home initial state
        homeData: null,
        homeLoading: false,
        homeError: null,
        lastHomeFetch: null,

        // Actions
        setUser: (user: any) => set({ user, isAuthenticated: !!user }),
        logout: () => set({ user: null, isAuthenticated: false }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),

        // Home actions
        setHomeData: (data: HomeData) => set({ homeData: data, homeError: null }),
        setHomeLoading: (loading: boolean) => set({ homeLoading: loading }),
        setHomeError: (error: string | null) => set({ homeError: error }),
        clearHomeError: () => set({ homeError: null }),
        updateLastHomeFetch: () => set({ lastHomeFetch: Date.now() }),
        isHomeCacheValid: () => {
          const { lastHomeFetch } = get();
          if (!lastHomeFetch) return false;
          const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
          return Date.now() - lastHomeFetch < fiveMinutes;
        },
      }));

export default useStore;