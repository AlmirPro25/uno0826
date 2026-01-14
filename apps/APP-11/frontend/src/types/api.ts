
import { UUID, UserProfile, Project, ProjectStyle } from './models';

// Generic API Error Response
export interface APIErrorResponse {
  error: string;
  code?: string; // e.g., "INVALID_INPUT", "EMAIL_TAKEN", "NOT_FOUND"
}

// Beta Subscription API
export interface BetaSubscriptionRequest {
  name: string;
  email: string;
}

export interface BetaSubscriptionResponse {
  message: string;
  subscriptionId: UUID;
}

// Project API
// Corrected type for CreateProjectRequest to match backend enum
export interface CreateProjectRequest {
  name: string;
  description: string;
  requirements: string[];
  stylePreference?: ProjectStyle; // Use ProjectStyle enum
  targetAudience?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  requirements?: string[];
  stylePreference?: ProjectStyle;
  targetAudience?: string;
  status?: Project["status"]; // Allow updating status by admin or specific actions
  generatedCodeUrl?: string; // Allow updating generated code URL by AI service
  previewImageUrl?: string; // Allow updating preview image URL by AI service
}

export type ListProjectsResponse = Project[];

// User Profile Update API
export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  password?: string;
}

export type UserProfileResponse = UserProfile;
