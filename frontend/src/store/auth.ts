import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User, refreshToken?: string) => void;
  updateUser: (updates: Partial<User>) => void;
  setToken: (token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token:        null,
      refreshToken: null,
      user:         null,
      setAuth: (token, user, refreshToken) => {
        localStorage.setItem("sore_token", token);
        if (refreshToken) localStorage.setItem("sore_refresh", refreshToken);
        set({ token, user, refreshToken: refreshToken ?? get().refreshToken });
      },
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        }));
      },
      setToken: (token) => {
        localStorage.setItem("sore_token", token);
        set({ token });
      },
      logout: () => {
        localStorage.removeItem("sore_token");
        localStorage.removeItem("sore_refresh");
        set({ token: null, refreshToken: null, user: null });
      },
      isAdmin: () => get().user?.role === "ADMIN",
    }),
    { name: "sore_auth" }
  )
);
