
export type UUID = string; // Representing Go's uuid.UUID as string

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface User {
  id: UUID;
  name: string;
  email: string;
  passwordHash: string; // Excluded from frontend, but here for completeness
  role: UserRole;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

export interface Session {
  id: UUID;
  userId: UUID;
  refreshToken: string; // Encrypted in DB, so not directly used on frontend
  expiresAt: string;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export enum BetaStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface BetaSubscription {
  id: UUID;
  name: string;
  email: string;
  subscriptionDate: string;
  status: BetaStatus;
}

export enum ProjectStatus {
  DRAFT = "DRAFT",
  GENERATING = "GENERATING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export enum ProjectStyle {
  MODERN = "MODERN",
  MINIMALIST = "MINIMALIST",
  CORPORATE = "CORPORATE",
  PLAYFUL = "PLAYFUL",
  VINTAGE = "VINTAGE",
  CUSTOM = "CUSTOM",
}

export interface Project {
  id: UUID;
  userId: UUID;
  name: string;
  description: string;
  requirements: string[];
  stylePreference: ProjectStyle;
  targetAudience?: string;
  generatedCodeUrl?: string;
  previewImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
}

export interface Plan {
  id: UUID;
  name: string;
  description?: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  TRIAL = "TRIAL",
  EXPIRED = "EXPIRED",
  PAUSED = "PAUSED",
}

export interface UserSubscription {
  id: UUID;
  userId: UUID;
  planId: UUID;
  startDate: string;
  endDate?: string;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}
