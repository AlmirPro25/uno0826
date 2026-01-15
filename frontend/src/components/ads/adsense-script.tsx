"use client";

import { useEffect } from "react";

export function AdSenseScript() {
  useEffect(() => {
    // Only load AdSense on client-side to avoid hydration issues
    const script = document.createElement("script");
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5385779634645102";
    script.async = true;
    script.crossOrigin = "anonymous";
    
    // Silently fail if blocked by ad blocker
    script.onerror = () => {
      console.log("AdSense blocked by ad blocker - this is expected in development");
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}
