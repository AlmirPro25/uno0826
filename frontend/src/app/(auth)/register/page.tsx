"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
    const { login } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Register
            await api.post("/auth/register", { username: email, name, email, password }); // Backend might expect username same as email or separate. The model has both. I'll send email as username just in case, or check RegisterRequest struct.

            // 2. Login
            const loginRes = await api.post("/auth/login", { username: email, password, applicationScope: "prost-qs" });

            // 3. Set Auth State
            await login(
                loginRes.data.token,
                loginRes.data.refreshToken,
                loginRes.data.expiresAt
            );

            // Redirect is handled by login/authContext usually, or we can force it if needed, but context does it.
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(
                err.response?.data?.error || "Registration failed. Please try again."
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
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your information below to create your account
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
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-muted/50"
                    />
                </div>
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
                    {loading ? "Creating account..." : "Sign Up"}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary font-medium"
                >
                    Sign in
                </Link>
            </div>
        </motion.div>
    );
}
