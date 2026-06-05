import axios from "axios";
import { useAuthStore } from "../store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Inject access token ke setiap request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh saat access token expired (401)
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => { original.headers.Authorization = `Bearer ${token}`; resolve(api(original)); },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post("/api/auth/refresh", { refreshToken });
      useAuthStore.getState().setToken(data.token);
      useAuthStore.getState().setAuth(data.token, useAuthStore.getState().user!, data.refreshToken);
      pendingQueue.forEach(p => p.resolve(data.token));
      pendingQueue = [];
      original.headers.Authorization = `Bearer ${data.token}`;
      return api(original);
    } catch (err) {
      pendingQueue.forEach(p => p.reject(err));
      pendingQueue = [];
      useAuthStore.getState().logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
