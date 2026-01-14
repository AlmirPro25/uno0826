import { useState, useCallback, useRef, useEffect } from 'react';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface CacheOptions {
    ttl?: number; // Time to live in milliseconds (default: 5 minutes)
    staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory cache store
const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * Hook for caching API responses
 * @param key - Unique cache key
 * @param fetcher - Function that fetches the data
 * @param options - Cache options
 */
export function useCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
) {
    const { ttl = DEFAULT_TTL, staleWhileRevalidate = true } = options;
    
    const [data, setData] = useState<T | null>(() => {
        const cached = cacheStore.get(key);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        return null;
    });
    const [loading, setLoading] = useState(!data);
    const [error, setError] = useState<Error | null>(null);
    const [isStale, setIsStale] = useState(false);
    
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const fetchData = useCallback(async (force = false) => {
        const cached = cacheStore.get(key);
        const now = Date.now();

        // Return cached data if still valid and not forcing refresh
        if (!force && cached && now < cached.expiresAt) {
            setData(cached.data);
            setLoading(false);
            return cached.data;
        }

        // If stale data exists and staleWhileRevalidate is enabled
        if (staleWhileRevalidate && cached) {
            setData(cached.data);
            setIsStale(true);
        }

        setLoading(true);
        setError(null);

        try {
            const freshData = await fetcherRef.current();
            
            // Update cache
            cacheStore.set(key, {
                data: freshData,
                timestamp: now,
                expiresAt: now + ttl,
            });

            setData(freshData);
            setIsStale(false);
            return freshData;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, [key, ttl, staleWhileRevalidate]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = useCallback(() => fetchData(true), [fetchData]);

    const invalidate = useCallback(() => {
        cacheStore.delete(key);
        setData(null);
    }, [key]);

    return {
        data,
        loading,
        error,
        isStale,
        refresh,
        invalidate,
    };
}

/**
 * Hook for caching with pagination support
 */
export function usePaginatedCache<T>(
    baseKey: string,
    fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
    options: CacheOptions & { pageSize?: number } = {}
) {
    const { pageSize = 10, ...cacheOptions } = options;
    const [page, setPage] = useState(1);
    const [allData, setAllData] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchPage = useCallback(async (pageNum: number) => {
        const key = `${baseKey}_page_${pageNum}_size_${pageSize}`;
        const cached = cacheStore.get(key);
        const now = Date.now();

        if (cached && now < cached.expiresAt) {
            return cached.data;
        }

        const result = await fetcher(pageNum, pageSize);
        
        cacheStore.set(key, {
            data: result,
            timestamp: now,
            expiresAt: now + (cacheOptions.ttl || DEFAULT_TTL),
        });

        return result;
    }, [baseKey, pageSize, fetcher, cacheOptions.ttl]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchPage(page);
                setAllData(result.data);
                setTotal(result.total);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [page, fetchPage]);

    const totalPages = Math.ceil(total / pageSize);

    return {
        data: allData,
        loading,
        error,
        page,
        setPage,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: () => setPage(p => Math.min(p + 1, totalPages)),
        prevPage: () => setPage(p => Math.max(p - 1, 1)),
    };
}

/**
 * Utility to clear all cache or specific keys
 */
export const cacheUtils = {
    clear: () => cacheStore.clear(),
    delete: (key: string) => cacheStore.delete(key),
    deleteByPrefix: (prefix: string) => {
        for (const key of cacheStore.keys()) {
            if (key.startsWith(prefix)) {
                cacheStore.delete(key);
            }
        }
    },
    has: (key: string) => cacheStore.has(key),
    size: () => cacheStore.size,
};
