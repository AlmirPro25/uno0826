"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-12 h-12 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight">Payment Canceled</h1>
                <p className="text-muted-foreground text-lg">
                    You have not been charged. If this was a mistake, you can try again.
                </p>

                <div className="pt-6 flex gap-4 justify-center">
                    <Button size="lg" variant="outline" onClick={() => window.location.href = '/dashboard'}>
                        Return to Dashboard
                    </Button>
                    <Button size="lg" onClick={() => window.location.href = '/dashboard/billing'}>
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}
