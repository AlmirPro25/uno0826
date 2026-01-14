
import { registerUser, loginUser, refreshAccessToken, fetchAuthenticatedUserProfile, updateAuthenticatedUserProfile } from '@/lib/auth';
import { RegisterRequest, LoginRequest, RefreshTokenRequest, UpdateUserProfileRequest, AuthResponse, UserProfile } from '@/types/auth';

/**
 * API client for Authentication related operations.
 * This acts as a wrapper/re-export for functions already defined in '@/lib/auth.ts'
 * to adhere to the `services/api/*` structure.
 */
export const authService = {
  /**
   * Registers a new user.
   * @param data - User registration details.
   * @returns AuthResponse containing tokens and user profile.
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return registerUser(data);
  },

  /**
   * Logs in a user.
   * @param data - User login credentials.
   * @returns AuthResponse containing tokens and user profile.
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return loginUser(data);
  },

  /**
   * Refreshes the access token using the refresh token.
   * @returns AuthResponse containing new tokens and user profile.
   */
  refresh: async (): Promise<AuthResponse> => {
    return refreshAccessToken();
  },

  /**
   * Fetches the profile of the currently authenticated user.
   * @returns UserProfile object.
   */
  getProfile: async (): Promise<UserProfile> => {
    return fetchAuthenticatedUserProfile();
  },

  /**
   * Updates the profile of the currently authenticated user.
   * @param data - Partial user profile data to update.
   * @returns Updated UserProfile object.
   */
  updateProfile: async (data: UpdateUserProfileRequest): Promise<UserProfile> => {
    return updateAuthenticatedUserProfile(data);
  },
};
