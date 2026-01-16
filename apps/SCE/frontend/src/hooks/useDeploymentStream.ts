
import { useState, useEffect, useRef } from 'react';
import { DeploymentService } from '@/services/api/deployment.service';
import { DeploymentStatus } from '@/types';

/**
 * @description Hook especializado em streaming de eventos de infraestrutura.
 */
export function useDeploymentStream(deploymentId: string, currentStatus: DeploymentStatus) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Só inicia stream se estiver em processo de build/deploy
    const activeStatuses: DeploymentStatus[] = ['QUEUED', 'BUILDING', 'DEPLOYING'];
    
    if (!deploymentId || !activeStatuses.includes(currentStatus)) {
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    const url = DeploymentService.getLogStreamUrl(deploymentId);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs(prev => [...prev, data.message]);
      } catch (e) {
        setLogs(prev => [...prev, event.data]);
      }
    };

    es.onerror = () => {
      es.close();
      setIsStreaming(false);
    };

    return () => {
      es.close();
      setIsStreaming(false);
    };
  }, [deploymentId, currentStatus]);

  const clearLogs = () => setLogs([]);

  return { logs, isStreaming, clearLogs };
}
