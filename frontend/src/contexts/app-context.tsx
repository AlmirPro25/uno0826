"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./auth-context";

// Tipos
export type AppRole = "owner" | "admin" | "viewer";

export interface AppMembership {
    app_id: string;
    app_name: string;
    app_slug: string;
    role: AppRole;
    joined_at: string;
}

export interface ActiveApp {
    id: string;
    name: string;
    slug: string;
    role: AppRole;
}

interface AppContextType {
    // Estado
    apps: AppMembership[];
    activeApp: ActiveApp | null;
    loading: boolean;
    
    // Ações
    setActiveApp: (appId: string) => void;
    refreshApps: () => Promise<void>;
    
    // Helpers
    hasApp: boolean;
    isOwner: boolean;
    isAdmin: boolean;
    canManage: boolean; // owner ou admin
}

const AppContext = createContext<AppContextType>({
    apps: [],
    activeApp: null,
    loading: true,
    setActiveApp: () => {},
    refreshApps: async () => {},
    hasApp: false,
    isOwner: false,
    isAdmin: false,
    canManage: false,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [apps, setApps] = useState<AppMembership[]>([]);
    const [activeApp, setActiveAppState] = useState<ActiveApp | null>(null);
    const [loading, setLoading] = useState(true);

    // Buscar apps do usuário
    const fetchApps = useCallback(async () => {
        if (!isAuthenticated) {
            setApps([]);
            setActiveAppState(null);
            setLoading(false);
            return;
        }

        try {
            const res = await api.get("/apps/mine");
            const userApps = res.data.apps || [];
            
            // Mapear para memberships (por enquanto, owner de todos os apps que criou)
            const memberships: AppMembership[] = userApps.map((app: { id: string; name: string; slug: string; created_at: string }) => ({
                app_id: app.id,
                app_name: app.name,
                app_slug: app.slug,
                role: "owner" as AppRole, // Quem criou é owner
                joined_at: app.created_at,
            }));

            setApps(memberships);

            // Restaurar app ativo do localStorage ou selecionar primeiro
            const savedAppId = localStorage.getItem("activeAppId");
            const savedApp = memberships.find(m => m.app_id === savedAppId);
            
            if (savedApp) {
                // App salvo ainda existe na lista - usar ele
                setActiveAppState({
                    id: savedApp.app_id,
                    name: savedApp.app_name,
                    slug: savedApp.app_slug,
                    role: savedApp.role,
                });
            } else if (memberships.length > 0) {
                // App salvo não existe mais (stale) ou nunca existiu
                // Fallback: selecionar primeiro app automaticamente
                if (savedAppId) {
                    console.warn(`[AppContext] Stale activeAppId "${savedAppId}" não encontrado. Fallback para primeiro app.`);
                    localStorage.removeItem("activeAppId");
                }
                const first = memberships[0];
                setActiveAppState({
                    id: first.app_id,
                    name: first.app_name,
                    slug: first.app_slug,
                    role: first.role,
                });
                localStorage.setItem("activeAppId", first.app_id);
            } else {
                // Usuário não tem apps - limpar estado
                localStorage.removeItem("activeAppId");
                setActiveAppState(null);
            }
        } catch (error) {
            console.error("Failed to fetch apps", error);
            setApps([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchApps();
    }, [fetchApps]);

    // Trocar app ativo
    const setActiveApp = useCallback((appId: string) => {
        const membership = apps.find(m => m.app_id === appId);
        if (membership) {
            setActiveAppState({
                id: membership.app_id,
                name: membership.app_name,
                slug: membership.app_slug,
                role: membership.role,
            });
            localStorage.setItem("activeAppId", appId);
        }
    }, [apps]);

    // Helpers computados
    const hasApp = apps.length > 0;
    const isOwner = activeApp?.role === "owner";
    const isAdmin = activeApp?.role === "admin";
    const canManage = isOwner || isAdmin;

    // Super admin tem acesso total
    const isSuperAdmin = user?.role === "super_admin";

    return (
        <AppContext.Provider
            value={{
                apps,
                activeApp,
                loading,
                setActiveApp,
                refreshApps: fetchApps,
                hasApp,
                isOwner: isSuperAdmin || isOwner,
                isAdmin: isSuperAdmin || isAdmin,
                canManage: isSuperAdmin || canManage,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
