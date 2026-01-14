
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Sparkles, UserRound, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { name: 'Features', href: '#features' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuthStore();

  const isDashboardRoute = pathname.startsWith('/dashboard');

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentThemeIcon = theme === 'dark' ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />;
  const nextThemeText = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';

  return (
    <TooltipProvider>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur-sm transition-colors duration-300",
          isMobileMenuOpen ? "bg-background/90" : "bg-background/80"
        )}
        data-aid="main-header"
        role="banner"
      >
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" aria-label="Home - AI Web Weaver">
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="self-center text-xl font-semibold whitespace-nowrap text-foreground">
              AI Web Weaver
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Main navigation">
            {!isDashboardRoute && navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary-foreground/80 text-foreground/60"
                data-aid={`nav-link-${item.name.toLowerCase()}`}
              >
                {item.name}
              </Link>
            ))}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label={nextThemeText}
                  className="hover:bg-accent/50"
                >
                  {currentThemeIcon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{nextThemeText}</p>
              </TooltipContent>
            </Tooltip>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User menu">
                    <UserRound className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>
                    <span className="block text-sm font-medium">{user?.name || "Usuário"}</span>
                    <span className="block text-xs text-muted-foreground truncate">{user?.email || "email@example.com"}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" aria-label="Dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" aria-label="Configurações do perfil">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive" aria-label="Sair da conta">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild data-aid="login-button">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label={nextThemeText}
                  className="hover:bg-accent/50"
                >
                  {currentThemeIcon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{nextThemeText}</p>
              </TooltipContent>
            </Tooltip>

            {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="User menu">
                      <UserRound className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <span className="block text-sm font-medium">{user?.name || "Usuário"}</span>
                      <span className="block text-xs text-muted-foreground truncate">{user?.email || "email@example.com"}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              data-aid="mobile-menu-button"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              id="mobile-menu"
              role="menu"
              aria-labelledby="mobile-menu-button"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="md:hidden flex flex-col items-stretch pb-4 border-t border-border-foreground/10 bg-background/90"
            >
              <div className="container flex flex-col space-y-2">
                {!isDashboardRoute && navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    role="menuitem"
                    className="block px-4 py-2 text-foreground/80 hover:bg-accent hover:text-accent-foreground rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Button asChild className="w-full mt-2" data-aid="mobile-login-button">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                  </Button>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </TooltipProvider>
  );
}
