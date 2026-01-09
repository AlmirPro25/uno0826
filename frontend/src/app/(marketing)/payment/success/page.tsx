"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight">Payment Successful!</h1>
                <p className="text-muted-foreground text-lg">
                    Thank you for your subscription. Your account has been upgraded to the Pro Plan.
                </p>

                <div className="pt-6">
                    <Button size="lg" className="w-full" onClick={() => window.location.href = '/dashboard'}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
