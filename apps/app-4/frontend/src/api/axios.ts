import axios, { AxiosError } from "axios";

// Create an Axios instance with default configuration
export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});

// Helper to get auth data from localStorage
const getAuthData = () => {
    if (typeof window === 'undefined') return null;
    
    try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const parsed = JSON.parse(storage);
            return parsed.state || parsed;
        }
    } catch (e) {
        console.warn('Failed to parse auth storage:', e);
    }
    return null;
};

// Helper to clear auth data completely (localStorage + redirect)
const clearAuthAndRedirect = () => {
    if (typeof window === 'undefined') return;
    
    try {
        // Clear localStorage
        localStorage.removeItem('auth-storage');
        
        // Redirect to login if not already there
        if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth/login';
        }
    } catch (e) {
        console.warn('Failed to clear auth:', e);
    }
};

// Track if we're already handling a 401 to prevent multiple redirects
let isHandling401 = false;

// Request interceptor - attach token
axiosInstance.interceptors.request.use(
    (config) => {
        const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
        
        if (!isPublicEndpoint) {
            const authData = getAuthData();
            if (authData?.token) {
                config.headers.Authorization = `Bearer ${authData.token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors simply
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Skip for auth endpoints
        const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/me'];
        if (authEndpoints.some(endpoint => originalRequest?.url?.includes(endpoint))) {
            return Promise.reject(error);
        }

        // Skip for non-critical endpoints (don't logout for notification failures)
        const nonCriticalEndpoints = ['/notifications', '/ws/', '/chat/', '/health/', '/appointments/upcoming'];
        if (nonCriticalEndpoints.some(endpoint => originalRequest?.url?.includes(endpoint))) {
            return Promise.reject(error);
        }

        // Handle 401 - just clear auth and redirect once
        if (error.response?.status === 401 && !isHandling401) {
            isHandling401 = true;
            
            // Small delay to batch multiple 401s
            setTimeout(() => {
                clearAuthAndRedirect();
                isHandling401 = false;
            }, 100);
        }

        return Promise.reject(error);
    }
);

// Default export for compatibility
export default axiosInstance;
