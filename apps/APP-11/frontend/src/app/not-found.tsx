
import Link from 'next/link';
import { Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/navbar'; // Import Navbar
import { Footer } from '@/components/shared/footer'; // Import Footer

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex flex-col items-center justify-center flex-grow p-4 text-center bg-background">
        <Frown className="h-24 w-24 text-primary mb-6" aria-hidden="true" />
        <h1 className="text-5xl font-extrabold text-foreground mb-4">404 - Página Não Encontrada</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Ops! Parece que a página que você está procurando não existe ou foi movida.
          Não se preocupe, você pode voltar para a página inicial.
        </p>
        <Button asChild className="cta-button text-lg px-8 py-3">
          <Link href="/" aria-label="Voltar para a página inicial">
            Voltar para a Home
          </Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
