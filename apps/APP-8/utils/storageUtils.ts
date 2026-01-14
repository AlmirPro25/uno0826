/**
 * Utilitários para gerenciamento de armazenamento
 */

export interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

/**
 * Estima o tamanho usado no localStorage
 */
export function getStorageSize(): StorageInfo {
  let total = 0;
  
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    }
  }

  // Bytes para KB
  const usedKB = total / 1024;
  
  // Estimativa de limite (varia por navegador, geralmente 5-10MB)
  const estimatedLimit = 5 * 1024; // 5MB em KB
  
  return {
    used: usedKB,
    available: estimatedLimit - usedKB,
    total: estimatedLimit,
    percentage: (usedKB / estimatedLimit) * 100
  };
}

/**
 * Verifica se há espaço suficiente
 */
export function hasEnoughSpace(minKB: number = 500): boolean {
  const info = getStorageSize();
  return info.available > minKB;
}

/**
 * Formata tamanho em formato legível
 */
export function formatSize(kb: number): string {
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

/**
 * Obtém itens do localStorage ordenados por tamanho
 */
export function getStorageItemsBySize(): Array<{ key: string; size: number }> {
  const items: Array<{ key: string; size: number }> = [];
  
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      if (value) {
        items.push({
          key,
          size: (key.length + value.length) / 1024 // KB
        });
      }
    }
  }
  
  return items.sort((a, b) => b.size - a.size);
}

/**
 * Limpa itens menos importantes para liberar espaço
 */
export function cleanupStorage(targetKB: number = 1000): void {
  const items = getStorageItemsBySize();
  let freed = 0;
  
  // Prioridade de limpeza (do menos para o mais importante)
  const cleanupPriority = [
    'interaction-history',
    'long-term-memories',
    'gemini-companion-db',
    'personality-config',
    'user-profile'
  ];
  
  for (const priority of cleanupPriority) {
    if (freed >= targetKB) break;
    
    const item = items.find(i => i.key === priority);
    if (item) {
      localStorage.removeItem(item.key);
      freed += item.size;
      console.log(`Removed ${item.key} (${formatSize(item.size)})`);
    }
  }
  
  console.log(`Freed ${formatSize(freed)} of storage`);
}

/**
 * Verifica saúde do armazenamento
 */
export function checkStorageHealth(): {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  info: StorageInfo;
} {
  const info = getStorageSize();
  
  if (info.percentage < 70) {
    return {
      status: 'healthy',
      message: 'Armazenamento saudável',
      info
    };
  } else if (info.percentage < 90) {
    return {
      status: 'warning',
      message: 'Armazenamento próximo do limite. Considere limpar dados antigos.',
      info
    };
  } else {
    return {
      status: 'critical',
      message: 'Armazenamento crítico! Limpe dados para continuar.',
      info
    };
  }
}
