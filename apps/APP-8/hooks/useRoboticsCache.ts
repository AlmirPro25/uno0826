/**
 * 🗄️ Hook para Cache de Detecções Robotics
 * Evita re-detectar a mesma tela, melhorando performance
 */

import { useState, useCallback, useRef } from 'react';

interface CacheEntry {
  targetItems: string;
  detectType: string;
  timestamp: number;
  data: any;
  screenHash: string;
}

interface UseRoboticsCacheOptions {
  maxAge?: number; // Tempo máximo de cache em ms (padrão: 30s)
  maxEntries?: number; // Máximo de entradas no cache (padrão: 50)
}

export function useRoboticsCache(options: UseRoboticsCacheOptions = {}) {
  const { maxAge = 30000, maxEntries = 50 } = options;
  
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const lastScreenshot = useRef<string | null>(null);

  /**
   * Gera hash simples da tela (timestamp + dimensões)
   */
  const generateScreenHash = useCallback(async (): Promise<string> => {
    // Em produção, você poderia capturar um screenshot pequeno e fazer hash
    // Por enquanto, usamos timestamp arredondado (cache por 5s)
    const roundedTime = Math.floor(Date.now() / 5000) * 5000;
    return `screen_${roundedTime}`;
  }, []);

  /**
   * Gera chave de cache
   */
  const generateCacheKey = useCallback((
    targetItems: string,
    detectType: string,
    screenHash: string
  ): string => {
    return `${targetItems}_${detectType}_${screenHash}`;
  }, []);

  /**
   * Busca no cache
   */
  const get = useCallback(async (
    targetItems: string,
    detectType: string
  ): Promise<any | null> => {
    const screenHash = await generateScreenHash();
    const key = generateCacheKey(targetItems, detectType, screenHash);
    
    const entry = cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verifica se expirou
    if (Date.now() - entry.timestamp > maxAge) {
      cache.delete(key);
      setCache(new Map(cache));
      return null;
    }

    console.log(`✅ Cache HIT: ${targetItems} (${detectType})`);
    return entry.data;
  }, [cache, maxAge, generateScreenHash, generateCacheKey]);

  /**
   * Salva no cache
   */
  const set = useCallback(async (
    targetItems: string,
    detectType: string,
    data: any
  ): Promise<void> => {
    const screenHash = await generateScreenHash();
    const key = generateCacheKey(targetItems, detectType, screenHash);

    // Limpa entradas antigas se atingir o limite
    if (cache.size >= maxEntries) {
      const oldestKey = Array.from(cache.keys())[0];
      cache.delete(oldestKey);
    }

    const entry: CacheEntry = {
      targetItems,
      detectType,
      timestamp: Date.now(),
      data,
      screenHash
    };

    cache.set(key, entry);
    setCache(new Map(cache));
    
    console.log(`💾 Cache SET: ${targetItems} (${detectType})`);
  }, [cache, maxEntries, generateScreenHash, generateCacheKey]);

  /**
   * Limpa cache
   */
  const clear = useCallback(() => {
    setCache(new Map());
    console.log('🗑️ Cache limpo');
  }, []);

  /**
   * Limpa entradas expiradas
   */
  const cleanup = useCallback(() => {
    const now = Date.now();
    let cleaned = 0;

    cache.forEach((entry, key) => {
      if (now - entry.timestamp > maxAge) {
        cache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      setCache(new Map(cache));
      console.log(`🧹 Cache cleanup: ${cleaned} entradas removidas`);
    }
  }, [cache, maxAge]);

  /**
   * Detecta com cache
   */
  const detectWithCache = useCallback(async (
    targetItems: string,
    detectType: '2D bounding boxes' | 'Points' | 'Segmentation masks',
    enableThinking: boolean = false
  ): Promise<any> => {
    // Tenta buscar no cache
    const cached = await get(targetItems, detectType);
    if (cached) {
      return cached;
    }

    // Se não tem cache, faz requisição
    console.log(`🔍 Cache MISS: ${targetItems} (${detectType}) - Detectando...`);
    
    let endpoint = '';
    if (detectType === '2D bounding boxes') {
      endpoint = '/api/robotics/detect-2d';
    } else if (detectType === 'Points') {
      endpoint = '/api/robotics/detect-points';
    } else {
      endpoint = '/api/robotics/detect-masks';
    }

    const response = await fetch(`http://localhost:3001${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetItems,
        maxItems: 20,
        enableThinking
      })
    });

    const data = await response.json();

    // Salva no cache
    if (data.success) {
      await set(targetItems, detectType, data);
    }

    return data;
  }, [get, set]);

  return {
    get,
    set,
    clear,
    cleanup,
    detectWithCache,
    cacheSize: cache.size,
    cacheEntries: Array.from(cache.values())
  };
}
