import { create } from 'zustand';
import { User } from '@/src/types';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: Cookies.get('token') || null,
  isAuthenticated: !!Cookies.get('token'),
  isLoading: true,
  setUser: (user, token) => {
    if (token) {
      Cookies.set('token', token, { expires: 1 }); // 1 day
      set({ user, token, isAuthenticated: true });
    } else if (token === null) {
      Cookies.remove('token');
      set({ user: null, token: null, isAuthenticated: false });
    } else {
      set({ user });
    }
  },
  logout: () => {
    Cookies.remove('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  init: async () => {
    const token = Cookies.get('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        Cookies.remove('token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      Cookies.remove('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
