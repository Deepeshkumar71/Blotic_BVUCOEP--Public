/**
 * Supabase Performance Optimizations - Phase 2B
 * 
 * This module provides performance-optimized utilities for Supabase operations
 * without breaking existing functionality.
 */

import { supabase } from './client';

// Connection pool management
let connectionPool: Map<string, any> = new Map();

// Lazy-loaded realtime subscriptions
export const createOptimizedSubscription = async (
  table: string,
  callback: (payload: any) => void,
  options: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
  } = {}
) => {
  const { event = '*', filter } = options;
  const subscriptionKey = `${table}-${event}-${filter || 'all'}`;
  
  // Check if subscription already exists
  if (connectionPool.has(subscriptionKey)) {
    console.log(`[Supabase] Reusing existing subscription for ${subscriptionKey}`);
    return connectionPool.get(subscriptionKey);
  }
  
  console.log(`[Supabase] Creating new optimized subscription for ${subscriptionKey}`);
  
  const subscription = supabase
    .channel(`optimized-${subscriptionKey}`)
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe();
  
  // Store in connection pool
  connectionPool.set(subscriptionKey, subscription);
  
  return subscription;
};

// Batch query optimization
export const batchQueries = async <T>(
  queries: Array<() => Promise<T>>
): Promise<T[]> => {
  console.log(`[Supabase] Executing ${queries.length} queries in batch`);
  
  // Execute queries in parallel with controlled concurrency
  const BATCH_SIZE = 5;
  const results: T[] = [];
  
  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batch = queries.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(query => query()));
    results.push(...batchResults);
  }
  
  return results;
};

// Query result caching
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const cachedQuery = async <T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> => {
  const now = Date.now();
  const cached = queryCache.get(queryKey);
  
  // Return cached result if valid
  if (cached && (now - cached.timestamp) < cached.ttl) {
    console.log(`[Supabase] Cache hit for ${queryKey}`);
    return cached.data;
  }
  
  // Execute query and cache result
  console.log(`[Supabase] Cache miss for ${queryKey}, executing query`);
  const data = await queryFn();
  
  queryCache.set(queryKey, {
    data,
    timestamp: now,
    ttl: ttlMs
  });
  
  return data;
};

// Connection cleanup utilities
export const cleanupConnections = () => {
  console.log(`[Supabase] Cleaning up ${connectionPool.size} connections`);
  
  connectionPool.forEach((subscription, key) => {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    }
  });
  
  connectionPool.clear();
  queryCache.clear();
};

// Performance monitoring
export const getPerformanceMetrics = () => {
  return {
    activeSubscriptions: connectionPool.size,
    cachedQueries: queryCache.size,
    cacheHitRatio: calculateCacheHitRatio(),
    memoryUsage: getMemoryUsage(),
  };
};

let cacheHits = 0;
let cacheMisses = 0;

const calculateCacheHitRatio = () => {
  const total = cacheHits + cacheMisses;
  return total > 0 ? (cacheHits / total) * 100 : 0;
};

const getMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
    const memory = (window.performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }
  return null;
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupConnections);
  
  // Periodic cache cleanup (every 10 minutes)
  setInterval(() => {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    queryCache.forEach((cached, key) => {
      if ((now - cached.timestamp) > cached.ttl) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => queryCache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`[Supabase] Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }, 10 * 60 * 1000);
}
