"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, isAuthenticated, checkAuth } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        checkAuth(); // Check auth status on component mount
    }, [checkAuth]);

    useEffect(() => {
        if (mounted && isAuthenticated) {
            router.push('/'); // If already authenticated, redirect to dashboard
        }
    }, [isAuthenticated, router, mounted]);

    if (!mounted) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const success = await login(username, password);
        setLoading(false);

        if (success) {
            router.push('/');
        } else {
            setError('Invalid username or password');
        }
    };

    if (isAuthenticated) {
        return null; // Already authenticated, waiting for redirect
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-900 p-8 shadow-2xl border border-gray-800">
                <div className="text-center">
                    <h1 className="text-4xl font-mono font-bold text-emerald-400">GHOST PROTOCOL</h1>
                    <p className="mt-2 text-lg text-gray-400">Authentication Required</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="username" className="text-gray-300 font-mono text-sm">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full bg-gray-800 text-white border-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <Label htmlFor="password" className="text-gray-300 font-mono text-sm">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full bg-gray-800 text-white border-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        LOGIN
                    </Button>
                </form>
                <p className="text-center text-xs text-gray-500 font-mono">
                    Default credentials: admin / adminpass (change in .env)
                </p>
            </div>
        </div>
    );
}
