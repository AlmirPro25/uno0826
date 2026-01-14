
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/hooks/use-auth-store';
import { AuthResponse } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("NEXT_PUBLIC_API_BASE_URL is not defined. Please set it in your .env.local file.");
  throw new Error("API_BASE_URL is not defined.");
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending/receiving cookies, if refresh token is cookie-based
});

let isRefreshing = false;
let failedQueue: ((token: string) => void)[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom(null as any); // Indicate failure
    } else {
      prom(token as string); // Provide new token
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    // Check for token expiration (401 and specific message or code)
    // Note: Backend explicitly returns CodeTokenExpired for access tokens.
    if (error.response?.status === 401 && (error.response.data as any)?.code === 'TOKEN_EXPIRED' && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const { refreshToken, logout, setTokens, user } = useAuthStore.getState();
        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: newExpiresIn } = refreshResponse.data;

        setTokens(newAccessToken, newRefreshToken, newExpiresIn, user!); // User should be available if we had a valid refresh

        processQueue(null, newAccessToken); // Resolve all pending requests
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null); // Reject all pending requests
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
