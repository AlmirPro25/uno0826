
import '@/styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MANIFEST ARCHITECT | Sovereign Cloud Engine',
  description: 'Infraestrutura Soberana de Alto Desempenho',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased min-h-screen bg-grid-pattern bg-fixed`}>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
