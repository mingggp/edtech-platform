import { create } from 'zustand';

interface AuthState {
  user: any;
  setUser: (user: any) => void;
  isAdmin: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user, isAdmin: user?.role === 'admin' }),
  isAdmin: false,
}));
