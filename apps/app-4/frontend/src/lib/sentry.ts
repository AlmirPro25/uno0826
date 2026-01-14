/**
 * Sentry Configuration for Error Tracking
 * 
 * Para configurar:
 * 1. Crie uma conta em https://sentry.io
 * 2. Crie um projeto Next.js
 * 3. Copie o DSN e adicione em NEXT_PUBLIC_SENTRY_DSN
 */

// Configuração básica do Sentry (sem dependência externa)
// Para produção, instale: npm install @sentry/nextjs

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
}

interface ErrorContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

class ErrorTracker {
  private config: SentryConfig | null = null;
  private initialized = false;

  init(config: SentryConfig) {
    this.config = config;
    this.initialized = true;
    
    // Capturar erros não tratados
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.captureException(error || new Error(String(message)), {
          extra: { source, lineno, colno }
        });
      };

      window.onunhandledrejection = (event) => {
        this.captureException(event.reason, {
          tags: { type: 'unhandledrejection' }
        });
      };
    }

    console.log(`[ErrorTracker] Initialized for ${config.environment}`);
  }

  captureException(error: Error | unknown, context?: ErrorContext) {
    if (!this.initialized) {
      console.error('[ErrorTracker] Not initialized');
      return;
    }

    const errorData = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: this.config?.environment,
      ...context
    };

    // Em desenvolvimento, apenas logar
    if (this.config?.environment === 'development') {
      console.error('[ErrorTracker] Captured:', errorData);
      return;
    }

    // Em produção, enviar para Sentry
    this.sendToSentry(errorData);
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) return;

    const data = {
      message,
      level,
      timestamp: new Date().toISOString(),
      environment: this.config?.environment
    };

    if (this.config?.environment === 'development') {
      console.log(`[ErrorTracker] ${level.toUpperCase()}:`, message);
      return;
    }

    this.sendToSentry(data);
  }

  setUser(user: { id: string; email: string; role: string } | null) {
    // Armazenar contexto do usuário para incluir em erros
    if (typeof window !== 'undefined') {
      (window as unknown as { __sentryUser?: typeof user }).__sentryUser = user;
    }
  }

  private async sendToSentry(data: Record<string, unknown>) {
    if (!this.config?.dsn) return;

    try {
      // Implementação simplificada - em produção use @sentry/nextjs
      const response = await fetch(this.config.dsn, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.error('[ErrorTracker] Failed to send to Sentry');
      }
    } catch (err) {
      console.error('[ErrorTracker] Error sending to Sentry:', err);
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Helper functions
export function initErrorTracking() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('[ErrorTracker] NEXT_PUBLIC_SENTRY_DSN not configured');
    return;
  }

  errorTracker.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  });
}

export function captureError(error: Error | unknown, context?: ErrorContext) {
  errorTracker.captureException(error, context);
}

export function captureMessage(message: string, level?: 'info' | 'warning' | 'error') {
  errorTracker.captureMessage(message, level);
}

export function setUserContext(user: { id: string; email: string; role: string } | null) {
  errorTracker.setUser(user);
}

// React Error Boundary helper - use @sentry/nextjs para produção
// Esta é uma implementação placeholder que não usa JSX
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  _fallback?: React.ReactNode
): React.ComponentType<P> {
  // Retorna o componente original - em produção use @sentry/nextjs
  return Component;
}

/**
 * Exemplo de uso:
 * 
 * // Em _app.tsx
 * import { initErrorTracking, setUserContext } from '@/lib/sentry';
 * 
 * useEffect(() => {
 *   initErrorTracking();
 * }, []);
 * 
 * // Quando usuário logar
 * setUserContext({ id: user.id, email: user.email, role: user.role });
 * 
 * // Para capturar erros manualmente
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureError(error, { tags: { feature: 'booking' } });
 * }
 */
