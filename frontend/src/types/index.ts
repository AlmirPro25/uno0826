export interface UserProfile {
    id: string;
    user_id: string;
    name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    status: string;
    role: "admin" | "user" | "super_admin";
    created_at: string;
    updated_at: string;
    origin_app_id?: string;
    profile?: UserProfile;
    // Legacy fields fallback (optional)
    username?: string;
    email?: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    expiresAt: string;
}

export interface ValidateResponse {
    valid: boolean;
    user_id: string;
    role: "admin" | "user" | "super_admin";
    account_status: string;
}
