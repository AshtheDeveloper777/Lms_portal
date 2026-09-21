'use client';

import { create } from 'zustand';

type UserRole = 'student' | 'instructor' | null;

type AuthState = {
  userId: string | null;
  fullName: string | null;
  email: string | null;
  role: UserRole;
  isInitialized: boolean;
  setUser: (payload: {
    userId: string;
    fullName: string | null;
    email: string | null;
    role: UserRole;
  }) => void;
  setRole: (role: UserRole) => void;
  setInitialized: (val: boolean) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  fullName: null,
  email: null,
  role: null,
  isInitialized: false,

  setUser: ({ userId, fullName, email, role }) =>
    set({ userId, fullName, email, role, isInitialized: true }),

  setRole: (role) => set({ role }),

  setInitialized: (val) => set({ isInitialized: val }),

  clearUser: () =>
    set({ userId: null, fullName: null, email: null, role: null, isInitialized: true }),
}));
