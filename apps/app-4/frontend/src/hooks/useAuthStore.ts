import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthState, User, Role } from "@/types/auth";
import { axiosInstance } from "@/api/axios";

// Helper function to normalize role to string
const normalizeRole = (role: any): Role => {
    if (typeof role === 'object' && role !== null && 'name' in role) {
        return role.name as Role;
    }
    return role as Role;
};

interface ExtendedAuthState extends AuthState {
    refreshToken: string | null;
    setRefreshToken: (refreshToken: string) => void;
    updateToken: (token: string) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<ExtendedAuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            role: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            _hasHydrated: false,

            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            },

            login: (token: string, user: User) => {
                // Normalize role in case it's an object
                const normalizedRole = normalizeRole(user.role);
                const normalizedUser = { ...user, role: normalizedRole };

                set({
                    token,
                    user: normalizedUser,
                    role: normalizedRole,
                    isAuthenticated: true,
                    loading: false,
                });
                
                // Set token in axios
                if (typeof window !== 'undefined') {
                    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                }
            },

            setRefreshToken: (refreshToken: string) => {
                set({ refreshToken });
            },

            updateToken: (token: string) => {
                set({ token });
                if (typeof window !== 'undefined') {
                    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    role: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    loading: false,
                });
                if (typeof window !== 'undefined') {
                    delete axiosInstance.defaults.headers.common["Authorization"];
                }
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                // Called when store is rehydrated from localStorage
                if (state) {
                    state.setHasHydrated(true);
                    // Restore token to axios after rehydration
                    if (state.token && typeof window !== 'undefined') {
                        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
                    }
                }
            },
            partialize: (state) => ({
                // Only persist these fields
                user: state.user,
                token: state.token,
                role: state.role,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

