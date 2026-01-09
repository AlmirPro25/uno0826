"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LoginResponse } from "@/types";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // PROST-QS Auth Flow
            // Backend expects "username", we map email to username
            const res = await api.post<LoginResponse>("/auth/login", {
                username: email,
                password
            });

            // Login with tokens, Context will fetch Profile
            await login(
                res.data.token,
                res.data.refreshToken,
                res.data.expiresAt
            );

            // Redirect is handled by AuthContext but we await it here just in case logic changes
            // router.push... (Handled by Context)

        } catch (err: any) {
            console.error(err);
            setError(
                err.response?.data?.error || "Invalid credentials. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-2xl bg-card border border-border shadow-xl"
        >
            <div className="flex flex-col space-y-2 text-center mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your credentials to access the kernel.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                        {error}
                    </div>
                )}

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
                <div className="space-y-2">
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-muted/50"
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading} size="lg">
                    {loading ? "Authenticating..." : "Sign In"}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <Link
                    href="/forgot-password"
                    className="underline underline-offset-4 hover:text-primary text-muted-foreground"
                >
                    Forgot your password?
                </Link>
            </div>
        </motion.div>
    );
}
