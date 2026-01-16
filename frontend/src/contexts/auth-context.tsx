"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useSyncExternalStore } from "react";
import { User } from "@/types";
import { useRouter, usePathname } from "next/navigation";
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
    const isLoggingIn = useRef(false);
    const initPromise = useRef<Promise<void> | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const logout = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        }
        setUser(null);
        isLoggingIn.current = false;
        router.push("/login");
    }, [router]);

    // Initialize auth state from localStorage
    useEffect(() => {
        // Skip on callback page - login() will handle everything
        if (pathname === '/callback') {
            setLoading(false);
            return;
        }

        // Don't interfere if login is in progress
        if (isLoggingIn.current) {
            return;
        }

        // Prevent duplicate initialization
        if (initPromise.current) {
            return;
        }

        const initializeAuth = async () => {
            if (typeof window === 'undefined') {
                setLoading(false);
                return;
            }

            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            // No token = not logged in
            if (!token || !storedUser) {
                setLoading(false);
                return;
            }

            try {
                // First, set user from localStorage for immediate UI
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                
                // Then validate token with backend (silently)
                try {
                    const res = await api.get("/identity/me");
                    if (res.data) {
                        setUser(res.data);
                        localStorage.setItem("user", JSON.stringify(res.data));
                    }
                } catch (err: unknown) {
                    const error = err as { response?: { status?: number } };
                    // Token expired or invalid
                    if (error.response?.status === 401) {
                        console.warn("Token expired, clearing session");
                        localStorage.removeItem("token");
                        localStorage.removeItem("refreshToken");
                        localStorage.removeItem("user");
                        setUser(null);
                        // Only redirect if on protected pages
                        if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/onboarding')) {
                            router.push("/login");
                        }
                    }
                    // Other errors (network, etc) - keep user logged in with cached data
                }
            } catch (error) {
                console.error("Auth initialization failed", error);
                // JSON parse error - clear corrupted data
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                setUser(null);
            }
            
            setLoading(false);
        };

        initPromise.current = initializeAuth();
    }, [router, pathname]);

    const login = useCallback(async (token: string, refreshToken: string) => {
        isLoggingIn.current = true;
        setLoading(true);
        
        // Save tokens immediately
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);

        try {
            // Fetch user profile
            const res = await api.get("/identity/me");
            const userData = res.data;

            // Save user data
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            
            // Check onboarding status
            const onboardingComplete = localStorage.getItem("onboarding_complete");

            // Determine redirect destination
            let destination = "/dashboard";
            if (!onboardingComplete && userData.role !== 'admin' && userData.role !== 'super_admin') {
                destination = "/onboarding";
            }

            // Small delay to ensure React state is committed
            await new Promise(resolve => setTimeout(resolve, 50));
            
            setLoading(false);
            isLoggingIn.current = false;
            
            // Navigate to destination
            router.push(destination);
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            // Clear everything on failure
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            setUser(null);
            setLoading(false);
            isLoggingIn.current = false;
            router.push("/login?error=profile_fetch_failed");
        }
    }, [router]);

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
