import { axiosInstance } from "./axios";
import { User } from "@/types/auth";

export interface LoginResponse {
    token: string;
    role: string;
    refreshToken?: string;
}

export interface RegisterPayload {
    fullName: string;
    email: string;
    password: string;
    phone: string;
}

export interface RefreshTokenResponse {
    token: string;
}

export const authAPI = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const response = await axiosInstance.post<LoginResponse>("/auth/login", {
            email,
            password,
        });
        return response.data;
    },

    register: async (payload: RegisterPayload): Promise<User> => {
        const response = await axiosInstance.post<User>("/auth/register", payload);
        return response.data;
    },

    refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
        const response = await axiosInstance.post<RefreshTokenResponse>("/auth/refresh-token", {
            refreshToken,
        });
        return response.data;
    },

    logoutAllDevices: async (): Promise<{ message: string }> => {
        const response = await axiosInstance.post<{ message: string }>("/auth/logout-all");
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string, logoutAll: boolean = false): Promise<{ message: string }> => {
        const response = await axiosInstance.post<{ message: string }>("/auth/change-password", {
            currentPassword,
            newPassword,
            logoutAll,
        });
        return response.data;
    },

    getMe: async (): Promise<User> => {
        const response = await axiosInstance.get<User>("/auth/me");
        return response.data;
    },
};
