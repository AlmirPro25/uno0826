
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background border-t border-border-foreground/10 py-8" role="contentinfo">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <Link href="/" className="flex items-center space-x-2" aria-label="Home - AI Web Weaver">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-lg font-semibold whitespace-nowrap text-foreground">
            AI Web Weaver
          </span>
        </Link>

        <nav className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Rodapé de navegação">
          <Link href="#features" className="hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#testimonials" className="hover:text-primary transition-colors">
            Testimonials
          </Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </nav>

        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} AI Web Weaver. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
