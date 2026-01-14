import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Calendar, TrendingUp, TrendingDown, Clock, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './shadcn/Card';

interface Metric {
  label: string;
  value: number;
  previousValue: number;
  icon: React.ReactNode;
  format?: 'number' | 'percentage' | 'currency' | 'time';
  color?: string;
}

interface RealTimeMetricsProps {
  metrics: Metric[];
  refreshInterval?: number; // in milliseconds
  onRefresh?: () => Promise<void>;
}

export function RealTimeMetrics({ metrics, refreshInterval = 30000, onRefresh }: RealTimeMetricsProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!onRefresh) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      await onRefresh();
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      case 'time':
        return `${Math.floor(value / 60)}h ${value % 60}m`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <Wifi className={`w-4 h-4 ${isRefreshing ? 'text-green-500 animate-pulse' : ''}`} />
          <span>Atualização em tempo real</span>
        </div>
        <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const change = getChangePercentage(metric.value, metric.previousValue);
          const isPositive = change >= 0;

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.label}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${metric.color || 'bg-primary-100 dark:bg-primary-900/30'}`}>
                      {metric.icon}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div
                    key={metric.value}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    {formatValue(metric.value, metric.format)}
                  </motion.div>
                  <div className={`flex items-center mt-2 text-sm ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    <span>{Math.abs(change).toFixed(1)}%</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">vs anterior</span>
                  </div>
                </CardContent>
                {/* Animated background indicator */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-1 ${
                    isPositive ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.abs(change), 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Live Activity Feed
interface ActivityItem {
  id: string;
  type: 'appointment' | 'payment' | 'user' | 'review';
  message: string;
  timestamp: Date;
  user?: string;
}

interface LiveActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export function LiveActivityFeed({ activities, maxItems = 5 }: LiveActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'user':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'review':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Atividade em Tempo Real</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, maxItems).map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {activity.message}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(activity.timestamp)}</span>
                  {activity.user && (
                    <>
                      <span>•</span>
                      <span>{activity.user}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// System Status Component
interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
}

interface SystemStatusProps {
  services: SystemStatus[];
}

export function SystemStatusPanel({ services }: SystemStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operacional';
      case 'degraded':
        return 'Degradado';
      case 'down':
        return 'Fora do ar';
      default:
        return 'Desconhecido';
    }
  };

  const allOperational = services.every(s => s.status === 'operational');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
          <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${
            allOperational 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${allOperational ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span>{allOperational ? 'Todos operacionais' : 'Alguns problemas'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{service.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                {service.latency && (
                  <span className="text-xs text-gray-500">{service.latency}ms</span>
                )}
                <span className={`text-xs ${
                  service.status === 'operational' ? 'text-green-600' :
                  service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getStatusText(service.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
