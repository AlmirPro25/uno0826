/**
 * ============================================
 * ENTERPRISE LOGGER - Logs Estruturados
 * ============================================
 * 
 * Padrão: Logs que salvam vidas às 3h da manhã
 * Nível: Tech Lead Itaú
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private static instance: Logger;
  private serviceName: string;
  private environment: string;

  private constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'nexus-bank-api';
    this.environment = process.env.NODE_ENV || 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(level: LogLevel, message: string, context: LogContext = {}, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.serviceName,
        environment: this.environment,
        ...context
      }
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.environment === 'development' ? error.stack : undefined,
        code: (error as any).code
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const json = JSON.stringify(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(json);
        break;
      case LogLevel.WARN:
        console.warn(json);
        break;
      default:
        console.log(json);
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (this.environment === 'development') {
      this.output(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  public info(message: string, context?: LogContext): void {
    this.output(this.formatLog(LogLevel.INFO, message, context));
  }

  public warn(message: string, context?: LogContext): void {
    this.output(this.formatLog(LogLevel.WARN, message, context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.output(this.formatLog(LogLevel.ERROR, message, context, error));
  }

  public fatal(message: string, error?: Error, context?: LogContext): void {
    this.output(this.formatLog(LogLevel.FATAL, message, context, error));
  }

  // Log de requisição HTTP
  public httpRequest(req: any, res: any, duration: number): void {
    const context: LogContext = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id
    };

    const level = res.statusCode >= 500 ? LogLevel.ERROR 
                : res.statusCode >= 400 ? LogLevel.WARN 
                : LogLevel.INFO;

    this.output(this.formatLog(level, `HTTP ${req.method} ${req.originalUrl}`, context));
  }

  // Log de auditoria para operações sensíveis
  public audit(action: string, userId: string, details: Record<string, unknown>): void {
    this.output(this.formatLog(LogLevel.INFO, `AUDIT: ${action}`, {
      userId,
      action,
      ...details,
      auditTimestamp: new Date().toISOString()
    }));
  }

  // Log de segurança
  public security(event: string, context: LogContext): void {
    this.output(this.formatLog(LogLevel.WARN, `SECURITY: ${event}`, {
      ...context,
      securityEvent: true
    }));
  }
}

export const logger = Logger.getInstance();
