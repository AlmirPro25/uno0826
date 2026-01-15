"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useSyncExternalStore } from "react";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, refreshToken: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    isAuthenticated: false,
    isHydrated: false,
});

// Custom hook for hydration state
function useHydrated() {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const isHydrated = useHydrated();
    const hasInitialized = useRef(false);
    const router = useRouter();

    const logout = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        }
        setUser(null);
        router.push("/login");
    }, [router]);

    useEffect(() => {
        // Prevent double initialization in strict mode
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        // Initialize auth
        const initializeAuth = async () => {
            if (typeof window === 'undefined') {
                setLoading(false);
                return;
            }

            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (token && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    
                    // Validate token with backend silently
                    try {
                        const res = await api.get("/identity/me");
                        if (res.data) {
                            setUser(res.data);
                            localStorage.setItem("user", JSON.stringify(res.data));
                        }
                    } catch (err: unknown) {
                        const error = err as { response?: { status?: number } };
                        // Token expired or invalid - clear and redirect
                        if (error.response?.status === 401) {
                            console.warn("Token expired, clearing session");
                            localStorage.removeItem("token");
                            localStorage.removeItem("refreshToken");
                            localStorage.removeItem("user");
                            setUser(null);
                            router.push("/login");
                            setLoading(false);
                            return;
                        }
                    }
                } catch (error) {
                    console.error("Auth validation failed", error);
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, [router]);

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
                isHydrated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
