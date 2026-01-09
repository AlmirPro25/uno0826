"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, refreshToken: string, expiresAt: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (token && storedUser) {
                try {
                    // Optional: Validate token with backend here
                    // await api.get("/auth/me");
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error("Auth validation failed", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (token: string, refreshToken: string, expiresAt: string) => {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);

        try {
            // Fetch User Profile
            const res = await api.get("/identity/me");
            const userData = res.data;

            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);

            // Redirect based on role
            if (userData.role === 'admin' || userData.role === 'super_admin') {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            // Fallback (should not happen if token is valid)
            logout();
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
