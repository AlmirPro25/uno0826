"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="text-center space-y-6">
                <h1 className="text-9xl font-bold tracking-tighter text-muted-foreground/20">404</h1>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Page not found</h2>
                    <p className="text-muted-foreground">The resource you are looking for does not exist or has been moved.</p>
                </div>
                <div className="pt-4">
                    <Button onClick={() => window.location.href = '/'}>
                        Back to Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
