"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setSubmitted(true);
            setLoading(false);
        }, 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-2xl bg-card border border-border shadow-xl"
        >
            {!submitted ? (
                <>
                    <Link href="/login" className="mb-6 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                    </Link>
                    <div className="flex flex-col space-y-2 text-center mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email address to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-muted/50"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading} size="lg">
                            {loading ? "Sending link..." : "Send Reset Link"}
                        </Button>
                    </form>
                </>
            ) : (
                <div className="text-center py-8">
                    <h1 className="text-2xl font-semibold mb-2">Check your inbox</h1>
                    <p className="text-muted-foreground mb-6">
                        We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => window.location.href = '/login'}>
                        Back to Login
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
