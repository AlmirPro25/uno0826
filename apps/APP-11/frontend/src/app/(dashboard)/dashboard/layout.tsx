
"use client";

import { useAuthStore } from '@/hooks/use-auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { LayoutDashboard, FolderKanban, UserCog, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, logout, user } = useAuthStore();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Acesso Não Autorizado",
        description: "Você precisa estar logado para acessar o dashboard.",
      });
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const dashboardNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Meus Projetos', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Perfil', href: '/dashboard/profile', icon: UserCog },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex flex-1 pt-0"> {/* Adjusted padding-top */}
        {/* Sidebar for Desktop */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border-foreground/10 bg-card p-4 space-y-4 shadow-md">
          <h2 className="text-xl font-bold mb-4">Bem-vindo, {user?.name.split(' ')[0]}!</h2>
          <nav aria-label="Dashboard navigation">
            <ul className="space-y-2">
              {dashboardNavItems.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} passHref>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left flex items-center gap-2",
                        router.pathname === item.href && "bg-accent text-accent-foreground hover:bg-accent"
                      )}
                      aria-current={router.pathname === item.href ? "page" : undefined}
                    >
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                      {item.name}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto">
            <Button
              variant="destructive"
              className="w-full flex items-center gap-2"
              onClick={handleLogout}
            >
              <Power className="h-5 w-5" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8 max-w-full overflow-x-auto">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
