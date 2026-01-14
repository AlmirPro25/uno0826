
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Rocket, Accessibility, Scale, ShieldCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { AnimatedHeroCanvas } from '@/components/shared/animated-hero-canvas';
import { ScrollAnimationWrapper } from '@/components/shared/scroll-animation-wrapper';
import { GlassCard } from '@/components/shared/glass-card';
import { BetaSignupForm } from '@/components/forms/beta-signup-form';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth-store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleCTAClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard/new-project');
    } else {
      // Open beta signup modal or redirect
      router.push('/login'); // For now, direct to login, could be modal later
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Skip Link */}
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
        Pular para o conteúdo principal
      </a>

      <Navbar />

      <main id="main-content" role="main" className="flex-grow">
        {/* Hero Section */}
        <section
          id="hero"
          className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 py-16 bg-gradient-to-br from-background via-muted/50 to-background"
          aria-labelledby="hero-title"
        >
          <AnimatedHeroCanvas />
          <div className="relative z-10 max-w-4xl space-y-8">
            <motion.h1
              id="hero-title"
              className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tighter hero-gradient-text"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Crie Seu Site de Milhões com IA, Instantaneamente.
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              Interfaces de alta fidelidade, performance extrema e acessibilidade total,
              geradas por IA para impulsionar seu negócio ao sucesso digital.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
            >
              <Button
                className="cta-button text-lg px-8 py-3"
                onClick={handleCTAClick}
                data-aid="hero-cta-button"
                aria-label={isAuthenticated ? "Criar meu primeiro projeto" : "Obter acesso beta"}
              >
                {isAuthenticated ? "Criar meu primeiro projeto" : "Obter Acesso Beta"}
                <Zap className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                className="text-lg px-8 py-3 border-2 border-primary/50 text-primary-foreground hover:bg-primary/10"
                asChild
                data-aid="hero-learn-more-button"
              >
                <Link href="#features" aria-label="Saiba mais sobre as funcionalidades">
                  Saiba Mais <Sparkles className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-20 lg:py-24" aria-labelledby="features-title">
          <ScrollAnimationWrapper>
            <h2 id="features-title" className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
              A Excelência Digital ao Seu Alcance
            </h2>
          </ScrollAnimationWrapper>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-8 w-8 text-primary" />,
                title: "Geração Instantânea",
                description: "Descreva sua visão e observe a IA construir sua interface em segundos.",
                aid: "feature-instant-generation"
              },
              {
                icon: <Rocket className="h-8 w-8 text-blue-500" />,
                title: "Performance Absoluta",
                description: "Sites otimizados para Core Web Vitals, garantindo carregamento ultrarrápido.",
                aid: "feature-absolute-performance"
              },
              {
                icon: <Accessibility className="h-8 w-8 text-green-500" />,
                title: "Acessibilidade Total (WCAG 2.1)",
                description: "Construímos para todos. Seu site será inclusivo por padrão.",
                aid: "feature-accessibility"
              },
              {
                icon: <Scale className="h-8 w-8 text-purple-500" />,
                title: "Escalabilidade Sem Limites",
                description: "Arquitetura projetada para crescer com seu negócio, sem gargalos.",
                aid: "feature-scalability"
              },
              {
                icon: <ShieldCheck className="h-8 w-8 text-yellow-500" />,
                title: "Segurança de Nível Militar",
                description: "Proteção Zero Trust e criptografia AES-256 para seus dados.",
                aid: "feature-security"
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-orange-500" />,
                title: "SEO Otimizado Para o Sucesso",
                description: "Estrutura e metadados que garantem visibilidade máxima nos motores de busca.",
                aid: "feature-seo"
              },
            ].map((feature, index) => (
              <ScrollAnimationWrapper key={feature.aid} delay={index * 0.15}>
                <GlassCard
                  className="flex flex-col items-center text-center p-6 space-y-4"
                  data-aid={feature.aid}
                  whileHover={{ translateY: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
                  transition={{ duration: 0.3 }}
                >
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlassCard>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container py-20 lg:py-24">
          <ScrollAnimationWrapper>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
              Como Funciona
            </h2>
          </ScrollAnimationWrapper>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {[
              {
                step: 1,
                title: "Descreva Sua Visão",
                description: "Conte à nossa IA o tipo de site que você precisa, seu público-alvo e requisitos específicos.",
                imgSrc: "/images/step1-vision.webp",
                alt: "Interface de descrição de projeto com IA",
                aid: "how-it-works-step-1"
              },
              {
                step: 2,
                title: "Geração Inteligente",
                description: "Nossa IA processa suas informações e começa a tecer código, design e otimização.",
                imgSrc: "/images/step2-generation.webp",
                alt: "IA gerando código de website",
                aid: "how-it-works-step-2"
              },
              {
                step: 3,
                title: "Lance Sua Presença",
                description: "Revise, ajuste com ferramentas intuitivas e publique seu site de alta performance em minutos.",
                imgSrc: "/images/step3-launch.webp",
                alt: "Dashboard de publicação de site",
                aid: "how-it-works-step-3"
              },
            ].map((item, index) => (
              <ScrollAnimationWrapper key={item.aid} delay={index * 0.2}>
                <GlassCard className="relative p-8 group overflow-hidden h-full" data-aid={item.aid}>
                  <div className="absolute top-0 right-0 h-16 w-16 bg-primary/20 rounded-bl-full flex items-center justify-center translate-x-1/2 -translate-y-1/2 transition-all duration-300 group-hover:bg-primary/50">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4 mt-8">{item.title}</h3>
                  <p className="text-muted-foreground mb-6">{item.description}</p>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border-foreground/10">
                    <Image
                      src={item.imgSrc}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-500 ease-in-out group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </GlassCard>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="container py-20 lg:py-24" aria-labelledby="testimonials-title">
          <ScrollAnimationWrapper>
            <h2 id="testimonials-title" className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
              O Que Nossos Clientes Dizem
            </h2>
          </ScrollAnimationWrapper>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "AI Web Weaver transformou a forma como criamos e lançamos sites. A velocidade e qualidade são incomparáveis!",
                author: "Ana Souza",
                title: "CEO, TechSolutions",
                aid: "testimonial-1"
              },
              {
                quote: "Performance impecável e um design moderno. Nossos Core Web Vitals nunca foram tão bons!",
                author: "Marcos Lima",
                title: "CMO, DigitalGrowth",
                aid: "testimonial-2"
              },
              {
                quote: "Finalmente uma ferramenta que entrega acessibilidade por padrão. Um game-changer para nossa empresa.",
                author: "Patrícia Alves",
                title: "Fundadora, InclusivWeb",
                aid: "testimonial-3"
              },
            ].map((testimonial, index) => (
              <ScrollAnimationWrapper key={testimonial.aid} delay={index * 0.1}>
                <GlassCard className="p-6 space-y-4 h-full" data-aid={testimonial.aid}>
                  <p className="text-lg italic text-muted-foreground">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                </GlassCard>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </section>

        {/* Call to Action Section (Beta Signup) */}
        <section id="cta-beta" className="container py-20 lg:py-24 text-center">
          <ScrollAnimationWrapper>
            <GlassCard className="max-w-3xl mx-auto p-8 md:p-12 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Pronto para Criar Seu Próximo Site de Sucesso?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Junte-se ao nosso programa beta exclusivo e seja um dos primeiros a experimentar o poder da AI Web Weaver.
              </p>
              <div className="max-w-md mx-auto">
                <BetaSignupForm />
              </div>
            </GlassCard>
          </ScrollAnimationWrapper>
        </section>
      </main>

      <Footer />
    </div>
  );
}
