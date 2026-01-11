"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, refreshToken: string) => Promise<void>;
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

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/login");
    }, [router]);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error("Auth validation failed", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [logout]);

    const login = async (token: string, refreshToken: string) => {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);

        try {
            // Fetch User Profile
            const res = await api.get("/identity/me");
            const userData = res.data;

            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);

            // Check if onboarding is complete
            const onboardingComplete = localStorage.getItem("onboarding_complete");

            // Redirect based on role and onboarding status
            // Todos vão pro dashboard - a sidebar mostra o que cada role pode ver
            if (!onboardingComplete && userData.role !== 'admin' && userData.role !== 'super_admin') {
                // New user - send to onboarding (admins skip)
                router.push("/onboarding");
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            logout();
        }
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
