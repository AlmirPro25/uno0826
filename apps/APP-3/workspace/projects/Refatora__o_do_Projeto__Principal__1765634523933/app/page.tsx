
// Next.js page component (App Router) with internal components and styling.
// Stack: Next.js 15 (App Router) + React + TypeScript + Tailwind CSS + Framer Motion + Lucide React.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Zap, Code, Database, Shield, Brain, HardHat, Rocket, Github, Twitter, Linkedin, CheckCircle } from 'lucide-react';
import { NextPage } from 'next';
import Head from 'next/head';
import { z } from 'zod'; // Zod for client-side validation

// --- Global Constants ---
const PRIMARY_GRADIENT = "linear-gradient(90deg, #4F46E5, #8B5CF6)"; // Purple/Indigo
const SECONDARY_GRADIENT = "linear-gradient(90deg, #38BDF8, #0EA5E9)"; // Sky/Cyan
const TERTIARY_GRADIENT = "linear-gradient(90deg, #10B981, #059669)"; // Green/Emerald

// --- Component: Hero Section ---
const HeroSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Zod schema for email validation (matching backend validation)
  const waitlistSchema = z.object({
    email: z.string().email('E-mail inválido. Por favor, verifique o formato.').min(5, 'E-mail muito curto.'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Client-side validation using Zod
      waitlistSchema.parse({ email });

      // Real API call to Next.js Route Handler
      const response = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('🎉 Você está na lista de espera exclusiva! Fique atento ao seu e-mail.');
        setEmail('');
      } else {
        const data = await response.json();
        setMessage(`Erro: ${data.error || 'Algo deu errado.'}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setMessage(error.errors[0].message);
      } else {
        setMessage('Erro de rede. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section
      className="relative flex flex-col items-center justify-center min-h-screen pt-20 pb-12 overflow-hidden bg-black md:pt-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      data-aid="hero-section"
    >
      {/* Aurora Borealis background effect */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 blur-2xl pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-multiply filter animate-blob animation-delay-4000"></div>
        <div className="absolute top-3/4 left-1/4 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter animate-blob animation-delay-6000"></div>
      </div>

      <motion.div
        className="relative z-10 text-center max-w-4xl px-4"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        data-aid="hero-content"
      >
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold mb-4 leading-none tracking-tight">
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: PRIMARY_GRADIENT }}>
            Pare de Codar.
          </span>
          <br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: SECONDARY_GRADIENT }}>
            Comece a Arquitetar.
          </span>
        </h1>

        <p className="mt-4 text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto" data-aid="hero-subheading">
          Enquanto o ChatGPT te dá trechos de código quebrados, o Aurora entrega Arquitetura Enterprise,
          Segurança Bancária e Infraestrutura DevOps pronta. Em segundos.
        </p>

        {/* Waitlist form */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center" data-aid="waitlist-form">
          <div className="relative w-full sm:w-auto">
            {/* Accessibility: Add visually hidden label associated with input via `htmlFor` */}
            <label htmlFor="waitlist-email-input" className="sr-only">E-mail para lista de espera</label>
            <input
              id="waitlist-email-input"
              type="email"
              placeholder="Seu melhor e-mail..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full sm:w-80 px-6 py-3 text-lg text-white bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 backdrop-blur-md transition-all duration-300 placeholder-white/50"
              data-aid="waitlist-input-email"
              aria-label="E-mail para lista de espera"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="w-full sm:w-auto px-8 py-3 text-lg font-semibold rounded-lg text-black bg-white shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70 transition-all duration-300 disabled:opacity-50 min-w-[150px] min-h-[44px]"
            style={{ backgroundImage: SECONDARY_GRADIENT, backgroundSize: '150% 150%', backgroundPosition: 'left' }}
            disabled={isLoading}
            data-aid="waitlist-button-submit"
          >
            {isLoading ? 'Solicitando...' : 'Solicitar Acesso Antecipado'}
          </motion.button>
        </form>
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 text-sm font-medium ${message.startsWith('🎉') ? 'text-green-400' : 'text-red-400'}`}
              data-aid="form-message"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
};

// --- Component: Comparison Section ---
const ComparisonSection: React.FC = () => {
  const comparisonData = [
    {
      label: 'Qualidade do Código',
      other: 'Trechos de código soltos',
      aurora: 'Sistemas completos e coesos',
    },
    {
      label: 'Arquitetura',
      other: 'Sem padrões, alucinações',
      aurora: 'Clean Architecture e Padrões Sólidos (SOLID)',
    },
    {
      label: 'Segurança e DevOps',
      other: 'Débito técnico imediato',
      aurora: 'Segurança Bancária e Infraestrutura DevOps automatizada',
    },
    {
      label: 'Nível de Expertise',
      other: 'Júnior',
      aurora: 'Arquiteto Sênior',
    },
  ];

  return (
    <motion.section
      className="py-20 bg-gray-900 px-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      data-aid="comparison-section"
    >
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-12 text-gray-100" data-aid="comparison-heading">
          A Diferença <span className="text-transparent bg-clip-text" style={{ backgroundImage: PRIMARY_GRADIENT }}>Aurora</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Box 1: Other AIs */}
          <motion.div
            className="p-8 rounded-xl backdrop-blur-md bg-white/5 shadow-xl transition-all hover:shadow-cyan-500/30 border border-white/10"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            data-aid="other-ais-card"
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center text-gray-400" data-aid="other-ais-card-title">
              <Code className="w-6 h-6 mr-2 text-red-400" aria-label="Ícone de código" /> Outras IAs
            </h3>
            <ul className="space-y-4 text-gray-300" data-aid="other-ais-list">
              <li>- Código solto e trechos parciais</li>
              <li>- Sem contexto de projeto</li>
              <li>- Falhas de segurança óbvias</li>
              <li>- Não gera infraestrutura</li>
            </ul>
          </motion.div>

          {/* Box 2: Comparison Table */}
          <motion.div
            className="md:col-span-2 p-8 rounded-xl backdrop-blur-md bg-white/5 shadow-xl transition-all hover:shadow-purple-500/30 border border-white/10"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            data-aid="comparison-table-card"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-100" data-aid="comparison-table-title">
              <HardHat className="w-6 h-6 mr-2 text-yellow-400" aria-label="Ícone de capacete" /> O que um Arquiteto de Software precisa:
            </h3>
            <table className="w-full text-left table-auto" data-aid="comparison-table">
              <thead>
                <tr className="border-b border-white/20 text-gray-400">
                  <th className="py-2 px-4 font-normal" data-aid="comparison-table-header-1">Funcionalidade</th>
                  <th className="py-2 px-4 font-normal" data-aid="comparison-table-header-2">Outras IAs</th>
                  <th className="py-2 px-4 font-normal" data-aid="comparison-table-header-3">Aurora</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors" data-aid={`comparison-row-${index}`}>
                    <td className="py-3 px-4 text-gray-300 font-medium">{item.label}</td>
                    <td className="py-3 px-4 text-red-400">{item.other}</td>
                    <td className="py-3 px-4 font-bold text-transparent bg-clip-text" style={{ backgroundImage: PRIMARY_GRADIENT }}>
                      {item.aurora}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

// --- Component: Manifestos Section ---
const ManifestosSection: React.FC = () => {
  const manifestos = [
    {
      title: 'Security Guardian',
      description: 'Gere arquiteturas com segurança de nível bancário, autenticação JWT robusta, validação Zod e proteção contra XSS/CSRF.',
      icon: <Shield className="w-10 h-10 text-cyan-400" />,
      color: 'cyan'
    },
    {
      title: 'DevOps Commander',
      description: 'Infraestrutura DevOps completa com Docker Compose, CI/CD pipelines, monitoramento de logs e otimizações de performance.',
      icon: <HardHat className="w-10 h-10 text-green-400" />,
      color: 'green'
    },
    {
      title: 'E-commerce Supreme',
      description: 'Crie lojas virtuais completas com integração Stripe, gestão de estoque, busca otimizada e carrinho de compras funcional.',
      icon: <Database className="w-10 h-10 text-purple-400" />,
      color: 'purple'
    },
    {
      title: 'Clean Architecture',
      description: 'Separação de responsabilidades, código modular e testes de unidade. Esqueça o débito técnico.',
      icon: <Brain className="w-10 h-10 text-pink-400" />,
      color: 'pink'
    },
    {
      title: 'Microservices Architect',
      description: 'Projete sistemas distribuídos com APIs Gateways, balanceamento de carga e comunicação assíncrona com Kafka ou RabbitMQ.',
      icon: <Rocket className="w-10 h-10 text-indigo-400" />,
      color: 'indigo'
    },
    {
      title: 'Real-Time Wizard',
      description: 'Implemente Websockets para chat em tempo real, dashboards dinâmicos e sistemas de notificação instantânea.',
      icon: <Zap className="w-10 h-10 text-yellow-400" />,
      color: 'yellow'
    },
  ];

  return (
    <motion.section
      className="py-20 bg-black px-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      data-aid="manifestos-section"
    >
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-100" data-aid="manifestos-heading">
          O <span className="text-transparent bg-clip-text" style={{ backgroundImage: PRIMARY_GRADIENT }}>"Secret Sauce"</span>
        </h2>
        <p className="mb-16 text-xl text-gray-300" data-aid="manifestos-subheading">
          O Aurora usa Manifestos Técnicos. Não são prompts, são bibliotecas de arquitetura que garantem a qualidade do código.
        </p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
            hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
          }}
          data-aid="manifesto-grid"
        >
          {manifestos.map((manifesto, index) => (
            <motion.div
              key={index}
              className={`p-6 rounded-xl backdrop-blur-md bg-white/5 shadow-xl transition-all border border-white/10 ${manifesto.color}`}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              data-aid={`manifesto-card-${index}`}
            >
              <div className="mb-4">{manifesto.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-white">{manifesto.title}</h3>
              <p className="text-gray-300 text-sm">{manifesto.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

// --- Component: Terminal Simulation ---
const TerminalSimulation: React.FC = () => {
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullCommand = 'aurora create --ecommerce --stack react+go --auth jwt --db postgres --deploy docker';
  const delayTime = 30;

  // Simulate typing animation
  React.useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullCommand.length) {
        setTypedText(fullCommand.substring(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setTypedText((prev) => prev + '\n\nGerando Dockerfiles... OK');
          setTimeout(() => {
            setTypedText((prev) => prev + '\nConfigurando Stripe Payment Gateway... OK');
            setTimeout(() => {
              setTypedText((prev) => prev + '\nAplicando Segurança Bancária (OWASP)... OK');
              setTimeout(() => {
                setTypedText((prev) => prev + '\nArquitetura Enterprise Concluída!');
                setShowCursor(false);
              }, 1000);
            }, 1000);
          }, 1000);
        }, 500);
      }
    }, delayTime);

    return () => clearInterval(typingInterval);
  }, [fullCommand]);

  return (
    <motion.section
      className="py-20 bg-gray-900 px-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      data-aid="terminal-simulation-section"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-gray-100" data-aid="terminal-heading">
          Veja a <span className="text-transparent bg-clip-text" style={{ backgroundImage: TERTIARY_GRADIENT }}>Mágica Acontecer</span>
        </h2>
        <motion.div
          className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden font-mono text-white text-sm md:text-base p-6 text-left"
          data-aid="terminal-output-container"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-start items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-400">aurora-cli</span>
          </div>
          <pre className="whitespace-pre-wrap">
            <span className="text-cyan-400">$</span> {typedText}
            {showCursor && <span className="animate-pulse">_</span>}
          </pre>
        </motion.div>
      </div>
    </motion.section>
  );
};

// --- Component: Footer ---
const Footer: React.FC = () => {
  return (
    <footer className="py-10 bg-black border-t border-gray-800 px-4" data-aid="footer">
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="flex space-x-6 mb-4" data-aid="social-links-container">
          {/* Accessibility and Security: Add aria-label and rel="noopener noreferrer" */}
          <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors" data-aid="social-github" aria-label="Github" rel="noopener noreferrer">
            <Github className="w-6 h-6" />
          </a>
          <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors" data-aid="social-twitter" aria-label="Twitter" rel="noopener noreferrer">
            <Twitter className="w-6 h-6" />
          </a>
          <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors" data-aid="social-linkedin" aria-label="LinkedIn" rel="noopener noreferrer">
            <Linkedin className="w-6 h-6" />
          </a>
        </div>
        <p className="text-sm text-gray-500" data-aid="footer-copyright">
          © {new Date().getFullYear()} Aurora. Todos os direitos reservados.
        </p>
        <p className="text-xs text-gray-600 mt-1" data-aid="footer-location">
          Feito com 🇧🇷 em Salvador, Bahia.
        </p>
      </div>
    </footer>
  );
};

// --- Main Page Component ---
const AuroraLandingPage: NextPage = () => {
  return (
    <div className="min-h-screen antialiased">
      <Head>
        {/* Accessibility: Add language attribute to HTML tag */}
        <meta name="lang" content="pt-BR" />
        {/* SEO Metatags */}
        <title>Aurora | Pare de Codar. Comece a Arquitetar.</title>
        <meta name="description" content="O Aurora é o primeiro Arquiteto de Software Autônomo do mundo. Gere arquitetura enterprise, segurança bancária e infraestrutura DevOps em segundos. Entre na lista de espera exclusiva." />
        <meta name="keywords" content="AI Software Architect, Code Generator Enterprise, DevOps Automation, Next.js, Go, Clean Architecture, SaaS, Startup" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Aurora" />

        {/* OpenGraph Tags (Facebook, LinkedIn) */}
        <meta property="og:title" content="Aurora | Pare de Codar. Comece a Arquitetar." />
        <meta property="og:description" content="Gere arquitetura enterprise, segurança bancária e infraestrutura DevOps pronta. Em segundos." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.aurora.com.br" />
        <meta property="og:image" content="https://www.aurora.com.br/og-image.jpg" /> {/* Replace with actual image URL */}
        <meta property="og:site_name" content="Aurora" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aurora | Pare de Codar. Comece a Arquitetar." />
        <meta name="twitter:description" content="Gere arquitetura enterprise, segurança bancária e infraestrutura DevOps pronta. Em segundos." />
        <meta name="twitter:image" content="https://www.aurora.com.br/twitter-image.jpg" /> {/* Replace with actual image URL */}
      </Head>

      <main>
        <HeroSection />
        <ComparisonSection />
        <TerminalSimulation />
        <ManifestosSection />
      </main>
      <Footer />
    </div>
  );
};

export default AuroraLandingPage;
