"use client";

import { useEffect, useState } from "react";

export function AdSenseScript() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only load after hydration is complete
    if (!mounted) return;

    // Check if already loaded
    if (document.querySelector('script[src*="adsbygoogle"]')) return;

    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      const script = document.createElement("script");
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5385779634645102";
      script.async = true;
      script.crossOrigin = "anonymous";
      
      // Silently fail if blocked by ad blocker
      script.onerror = () => {
        // Silent - ad blockers are common
      };
      
      document.head.appendChild(script);
    }, 1000);

    return () => clearTimeout(timer);
  }, [mounted]);

  return null;
}
