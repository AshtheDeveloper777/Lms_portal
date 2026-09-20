import { create } from "zustand";

type UserRole = "student" | "instructor" | null;

type AuthState = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  role: null,

  setRole: (role) => set({ role }),

  clearRole: () => set({ role: null }),
}));
