
import Link from 'next/link';
import { AuthForm } from '@/components/forms/auth-forms';
import { Sparkles } from 'lucide-react';
import { Navbar } from '@/components/shared/navbar'; // Import Navbar

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar /> {/* Include Navbar */}
      <main className="flex flex-col items-center justify-center flex-grow p-4 bg-gradient-to-br from-background via-muted/50 to-background">
        <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-xl border border-border-foreground/10">
          <div className="flex flex-col items-center space-y-2">
            <Sparkles className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Crie Sua Conta</h1>
            <p className="text-muted-foreground">Comece sua jornada digital com AI Web Weaver.</p>
          </div>
          <AuthForm type="register" />
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline" data-aid="login-link">
              Faça login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
