import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/contexts/auth-context";
import { AppProvider } from "@/contexts/app-context";
import { Toaster } from "@/components/ui/sonner";
import { AdSenseScript } from "@/components/ads/adsense-script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PROST-QS | Governance Platform",
  description: "Governance, Audit, and Control for Intelligent Systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Google AdSense - loaded dynamically to avoid hydration issues with ad blockers */}
      </head>
      <body
        className={cn(
          "min-h-full bg-background font-sans text-foreground antialiased",
          inter.variable
        )}
        suppressHydrationWarning
      >
        <AuthProvider>
          <AppProvider>
            <AdSenseScript />
            {children}
            <Toaster />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
