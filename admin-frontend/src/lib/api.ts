import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { tokenStorage } from "./tokenStorage";
import type { RefreshResponse } from "../types/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A separate, un-intercepted client for the refresh call itself,
// so a failed refresh can't trigger another refresh attempt.
const refreshClient = axios.create({ baseURL: BASE_URL });

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  for (const { resolve, reject } of pendingQueue) {
    if (token) resolve(token);
    else reject(error);
  }
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => {
    // Backend wraps every response as { success, data, message }.
    // Unwrap it here so callers just get the real payload.
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const status = error.response?.status;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/admin/login") ||
      originalRequest?.url?.includes("/auth/admin/refresh");
      
    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request already triggered a refresh — wait for it.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshClient.post<{ success: boolean; data: RefreshResponse; message: string }>(
        "/auth/admin/refresh",
        { refreshToken },
      );

      tokenStorage.updateTokens(data.data);
      flushQueue(null, data.data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      tokenStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;