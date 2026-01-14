import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Head from "next/head";
import { AppLayout } from "@/components/ui/Layout";
import { useRouter } from "next/router";
import { Providers } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AccessibilityProvider, SkipToContent } from "@/components/ui/Accessibility";
import { axiosInstance } from "@/api/axios";
import { AppointmentReminder } from "@/components/AppointmentReminder";
import { ChatWidget } from "@/components/ChatWidget";
import { 
    InstallPWABanner, 
    UpdateAvailableBanner, 
    OfflineIndicator,
    NotificationPermissionRequest 
} from "@/components/ui/PushNotifications";
import { Onboarding } from "@/components/Onboarding";

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    
    // Initialize auth token on app load
    useEffect(() => {
        try {
            const storage = localStorage.getItem('auth-storage');
            if (storage) {
                const parsed = JSON.parse(storage);
                const state = parsed.state || parsed;
                if (state.token) {
                    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
                }
            }
        } catch (e) {
            console.warn('Failed to initialize auth:', e);
        }
    }, []);

    // Exclude layout for auth pages and public pages only
    const isAuthPage = router.pathname.startsWith("/auth");
    const isPublicPage = ['/', '/pricing', '/contact', '/faq', '/terms', '/privacy', '/about'].includes(router.pathname);
    const isFullscreenPage = router.pathname === '/queue/display' || 
                            router.pathname.startsWith('/nova') || 
                            router.pathname.startsWith('/sndt'); // TV display, NOVA and SNDT have their own layouts

    return (
        <ErrorBoundary>
            <Head>
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            </Head>
            <Providers>
                <AccessibilityProvider>
                    <ToastProvider>
                        <SkipToContent />
                        {isAuthPage || isPublicPage || isFullscreenPage ? (
                            <Component {...pageProps} />
                        ) : (
                            <AppLayout>
                                <main id="main-content">
                                    <Component {...pageProps} />
                                </main>
                            </AppLayout>
                        )}
                        {/* Appointment Reminder - shows for logged in patients */}
                        {!isAuthPage && !isPublicPage && <AppointmentReminder />}
                        {/* Chat Widget - floating chat for quick access */}
                        {!isAuthPage && !isPublicPage && !isFullscreenPage && <ChatWidget />}
                        {/* PWA & Notification Components */}
                        <InstallPWABanner />
                        <UpdateAvailableBanner />
                        <OfflineIndicator />
                        {!isAuthPage && !isPublicPage && <NotificationPermissionRequest />}
                        {/* Onboarding for new users */}
                        {!isAuthPage && !isPublicPage && <Onboarding />}
                    </ToastProvider>
                </AccessibilityProvider>
            </Providers>
        </ErrorBoundary>
    );
}
