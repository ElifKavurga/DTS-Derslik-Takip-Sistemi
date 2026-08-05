import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AuthResponse, AuthUser } from '@/types';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      login: (authResponse) =>
        set({
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          user: authResponse.user,
          isAuthenticated: true,
        }),
      logout: () => set(initialState),
      setUser: (user) => set({ user }),
      clearSession: () => set(initialState),
    }),
    {
      name: 'dts-auth-session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
