
import { AuthResponse, UserProfile, RegisterRequest, LoginRequest, RefreshTokenRequest, UpdateUserProfileRequest } from '@/types/auth';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/hooks/use-auth-store';
import { formatISODate } from './utils';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ACCESS_TOKEN_EXPIRY_KEY = 'accessTokenExpiresAt';
const USER_PROFILE_KEY = 'userProfile';

interface DecodedToken {
  userId: string;
  role: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  nbf: number; // Not before timestamp
}

export const decodeJwt = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const decodedPayload = JSON.parse(atob(parts[1]));
    return decodedPayload as DecodedToken;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

export const storeAuthTokens = (accessToken: string, refreshToken: string, expiresIn: number, user: UserProfile) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Calculate expiration time (current time + expiresIn seconds)
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem(ACCESS_TOKEN_EXPIRY_KEY, expiresAt.toString());
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  }
};

export const getAuthTokens = () => {
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const accessTokenExpiresAt = localStorage.getItem(ACCESS_TOKEN_EXPIRY_KEY);
    const userProfileStr = localStorage.getItem(USER_PROFILE_KEY);
    const userProfile: UserProfile | null = userProfileStr ? JSON.parse(userProfileStr) : null;

    return { accessToken, refreshToken, accessTokenExpiresAt: accessTokenExpiresAt ? parseInt(accessTokenExpiresAt) : null, userProfile };
  }
  return { accessToken: null, refreshToken: null, accessTokenExpiresAt: null, userProfile: null };
};

export const removeAuthTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
  }
};

export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  const { accessToken, refreshToken, expiresIn, user } = response.data;
  useAuthStore.getState().setTokens(accessToken, refreshToken, expiresIn, user);
  return response.data;
};

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  const { accessToken, refreshToken, expiresIn, user } = response.data;
  useAuthStore.getState().setTokens(accessToken, refreshToken, expiresIn, user);
  return response.data;
};

export const refreshAccessToken = async (): Promise<AuthResponse> => {
  const { refreshToken, setTokens, logout, user } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    throw new Error("No refresh token available. Please log in again.");
  }
  const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: newExpiresIn } = response.data;
  setTokens(newAccessToken, newRefreshToken, newExpiresIn, user!); // User should persist across refreshes
  return response.data;
};

export const fetchAuthenticatedUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/auth/me');
  return response.data;
};

export const updateAuthenticatedUserProfile = async (data: UpdateUserProfileRequest): Promise<UserProfile> => {
  const response = await apiClient.patch<UserProfile>('/auth/me', data);
  return response.data;
};
