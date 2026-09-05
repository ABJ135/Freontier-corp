import { create } from "zustand";
import { tokenStorage } from "../lib/tokenStorage";
import { loginUser } from "../services/authApi";
import type { Admin, LoginPayload } from "../types/auth";
import { isAxiosError } from "axios";

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Hydrate synchronously from storage so a page refresh doesn't
  // flash the login screen before we know the session is valid.
  admin: tokenStorage.getAdmin<Admin>(),
  isAuthenticated: Boolean(tokenStorage.getAccessToken()),
  isLoading: false,
  error: null,

   login: async (payload, rememberMe) => {
    set({ isLoading: true, error: null });

    try {
      const response = await loginUser(payload);

      tokenStorage.save(
        { accessToken: response.accessToken, refreshToken: response.refreshToken },
        response.admin,
        rememberMe,
      );

      set({
        admin: response.admin,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? "Invalid email or password."
        : "Invalid email or password.";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    tokenStorage.clear();
    set({ admin: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));