export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user" | "super_admin";
    avatar_url?: string;
    created_at: string;
    status: string;
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
