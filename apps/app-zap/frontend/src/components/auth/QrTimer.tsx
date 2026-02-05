"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress"; // Assuming you have a progress component or will use native

export function QrTimer() {
    const [progress, setProgress] = useState(100);
    const TOTAL_TIME = 45; // ~45 seconds for WA QR refresh

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev <= 0) return 0;
                return prev - (100 / TOTAL_TIME / 10); // Decrease every 100ms
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-64 mx-auto space-y-1">
            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-500 transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="text-[10px] text-muted-foreground/50 flex justify-between font-mono">
                <span>REFRESH_WOD_CODE</span>
                <span>{Math.ceil((progress / 100) * TOTAL_TIME)}s</span>
            </div>
        </div>
    );
}
