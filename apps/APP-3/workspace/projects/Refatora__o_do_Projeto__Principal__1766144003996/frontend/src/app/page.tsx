
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page component: Redirects to the main dashboard.
 * This ensures the user starts at the mission control panel immediately.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-xl font-mono text-gray-500">Loading Mission Control...</div>
    </div>
  );
}
