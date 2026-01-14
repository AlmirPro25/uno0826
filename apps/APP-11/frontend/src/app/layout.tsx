
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://aiwebweaver.com"),
  title: "AI Web Weaver - Crie Sites Incríveis com IA",
  description: "Gere interfaces de alta fidelidade, performance extrema e acessibilidade total para sua empresa com a inteligência artificial da AI Web Weaver.",
  keywords: ["IA", "Gerador de Sites", "Web Design", "Frontend AI", "Micro-SaaS", "Next.js", "Tailwind CSS"],
  openGraph: {
    title: "AI Web Weaver - Crie Sites Incríveis com IA",
    description: "Gere interfaces de alta fidelidade, performance extrema e acessibilidade total para sua empresa com a inteligência artificial da AI Web Weaver.",
    url: "https://aiwebweaver.com",
    siteName: "AI Web Weaver",
    images: [
      {
        url: "https://placehold.co/1200x630/0C0A09/white?text=AI+Web+Weaver", // Placeholder, replace with actual image
        width: 1200,
        height: 630,
        alt: "AI Web Weaver - IA gerando websites",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Web Weaver - Crie Sites Incríveis com IA",
    description: "Gere interfaces de alta fidelidade, performance extrema e acessibilidade total para sua empresa com a inteligência artificial da AI Web Weaver.",
    creator: "@aiwebweaver", // Replace with actual twitter handle
    images: ["https://placehold.co/1200x675/0C0A09/white?text=AI+Web+Weaver"], // Placeholder, replace with actual image
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "AI Web Weaver",
              "url": "https://aiwebweaver.com",
              "logo": "https://placehold.co/60x60/0C0A09/white?text=AW", // Replace with actual logo
              "sameAs": [
                "https://twitter.com/aiwebweaver", // Replace with actual social links
                "https://linkedin.com/company/ai-web-weaver"
              ]
            })
          }}
        />
        {/* Preload critical fonts for LCP optimization */}
        {/* For Google Fonts, Next.js handles it efficiently. If self-hosting: */}
        {/* <link rel="preload" href="/fonts/inter-v12-latin-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /> */}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
