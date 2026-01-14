// src/lib/monitoring.ts - Sistema de Monitoramento para Produção

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class ProductionMonitoring {
  private metrics: MetricData[] = [];
  private errors: any[] = [];
  private readonly maxMetrics = 1000;
  private readonly maxErrors = 100;

  // Métricas de performance
  trackApiCall(endpoint: string, duration: number, success: boolean) {
    this.addMetric('api_call_duration', duration, {
      endpoint,
      success: success.toString()
    });

    if (!success) {
      this.addMetric('api_call_errors', 1, { endpoint });
    }
  }

  trackTokenUsage(tokens: number, model: string, cost: number) {
    this.addMetric('tokens_used', tokens, { model });
    this.addMetric('api_cost', cost, { model });
  }

  trackUserAction(action: string, userId?: string) {
    this.addMetric('user_action', 1, {
      action,
      user_id: userId || 'anonymous'
    });
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context: context || {},
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errors.push(errorData);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Send to external service (Sentry, LogRocket, etc.)
    this.sendErrorToService(errorData);
  }

  private addMetric(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private async sendErrorToService(errorData: any) {
    try {
      // Exemplo: enviar para Sentry ou serviço próprio
      if (import.meta.env.PROD) {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        });
      } else {
        console.error('🚨 Error tracked:', errorData);
      }
    } catch (e) {
      console.error('Failed to send error to monitoring service:', e);
    }
  }

  // Analytics dashboard data
  getMetricsSummary() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    return {
      totalApiCalls: recentMetrics.filter(m => m.name === 'api_call_duration').length,
      averageResponseTime: this.calculateAverage(recentMetrics, 'api_call_duration'),
      totalTokensUsed: this.calculateSum(recentMetrics, 'tokens_used'),
      totalCost: this.calculateSum(recentMetrics, 'api_cost'),
      errorRate: this.calculateErrorRate(recentMetrics),
      activeUsers: this.countUniqueUsers(recentMetrics)
    };
  }

  private calculateAverage(metrics: MetricData[], name: string): number {
    const filtered = metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
  }

  private calculateSum(metrics: MetricData[], name: string): number {
    return metrics
      .filter(m => m.name === name)
      .reduce((sum, m) => sum + m.value, 0);
  }

  private calculateErrorRate(metrics: MetricData[]): number {
    const totalCalls = metrics.filter(m => m.name === 'api_call_duration').length;
    const errors = metrics.filter(m => m.name === 'api_call_errors').length;
    return totalCalls > 0 ? (errors / totalCalls) * 100 : 0;
  }

  private countUniqueUsers(metrics: MetricData[]): number {
    const userIds = new Set(
      metrics
        .filter(m => m.name === 'user_action' && m.tags?.user_id)
        .map(m => m.tags!.user_id)
    );
    return userIds.size;
  }

  // Performance monitoring
  measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    return fn()
      .then(result => {
        const duration = performance.now() - start;
        this.addMetric('performance', duration, { operation: name });
        return result;
      })
      .catch(error => {
        const duration = performance.now() - start;
        this.addMetric('performance', duration, { 
          operation: name, 
          error: 'true' 
        });
        throw error;
      });
  }

  // Real-time alerts
  checkAlerts() {
    const summary = this.getMetricsSummary();
    
    // Alert: High error rate
    if (summary.errorRate > 10) {
      this.sendAlert('high_error_rate', {
        rate: summary.errorRate,
        threshold: 10
      });
    }

    // Alert: High response time
    if (summary.averageResponseTime > 5000) {
      this.sendAlert('slow_response_time', {
        time: summary.averageResponseTime,
        threshold: 5000
      });
    }

    // Alert: High cost
    if (summary.totalCost > 10) { // $10 per hour
      this.sendAlert('high_api_cost', {
        cost: summary.totalCost,
        threshold: 10
      });
    }
  }

  private async sendAlert(type: string, data: any) {
    console.warn(`🚨 ALERT: ${type}`, data);
    
    // Enviar para Slack, Discord, email, etc.
    if (import.meta.env.PROD) {
      try {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, data, timestamp: Date.now() })
        });
      } catch (e) {
        console.error('Failed to send alert:', e);
      }
    }
  }
}

// Singleton instance
export const monitoring = new ProductionMonitoring();

// Auto-check alerts every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    monitoring.checkAlerts();
  }, 5 * 60 * 1000);
}

// Performance observer for Core Web Vitals
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        monitoring.trackApiCall('lcp', entry.startTime, true);
      }
      if (entry.entryType === 'first-input') {
        monitoring.trackApiCall('fid', (entry as any).processingStart - entry.startTime, true);
      }
    }
  });

  observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
}