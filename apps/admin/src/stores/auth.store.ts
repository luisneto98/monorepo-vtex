import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '@/services/api.service';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.post<{ accessToken: string; user: User }>(
            '/auth/login',
            { email, password },
          );
          console.log('Login response:', response);

          // The API returns: { success: true, data: { accessToken, user, ... } }
          if (response.success && response.data) {
            const { accessToken, user } = response.data;

            apiService.setToken(accessToken);
            // Note: refreshToken might be in cookies, not in response body

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            console.log('Login successful. State updated:', {
              user,
              isAuthenticated: true,
              token: accessToken ? 'Token set' : 'No token',
            });
          } else {
            set({
              isLoading: false,
              error: response.error?.message || 'Login failed',
            });
          }
        } catch (error) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: 'Network error. Please try again.',
          });
        }
      },

      logout: () => {
        apiService.setToken(null);
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: () => {
        const token = apiService.getToken();
        const currentState = useAuthStore.getState();

        // If we have a token and a user, we're authenticated
        if (token && currentState.user) {
          set({ isAuthenticated: true });
        }
        // If no token, clear authentication
        else if (!token) {
          set({ isAuthenticated: false, user: null });
        }
        // If token exists but no user, keep current state
        // (might be in the process of fetching user data)
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
