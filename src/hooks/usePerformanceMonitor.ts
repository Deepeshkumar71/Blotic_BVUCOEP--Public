import { useEffect, useRef } from 'react';

interface PerformanceMonitorOptions {
  // Check performance every X seconds (default: 30 seconds)
  checkIntervalSeconds?: number;
  // Log performance warnings (default: true)
  enableLogging?: boolean;
}

export const usePerformanceMonitor = (options: PerformanceMonitorOptions = {}) => {
  const {
    checkIntervalSeconds = 30,
    enableLogging = true
  } = options;

  const performanceCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enableLogging) return;

    const checkPerformance = () => {
      const now = Date.now();
      const timeSinceLastCheck = now - lastCheckTimeRef.current;
      const expectedInterval = checkIntervalSeconds * 1000;
      
      // If the actual interval is significantly longer than expected,
      // it might indicate the page was unresponsive
      if (timeSinceLastCheck > expectedInterval * 1.5) {
        console.warn(`[PerformanceMonitor] Potential unresponsiveness detected. Expected: ${expectedInterval}ms, Actual: ${timeSinceLastCheck}ms`);
        
        // Try to refresh any stale connections
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(() => {
            console.log('[PerformanceMonitor] Service worker is ready');
          }).catch(() => {
            console.log('[PerformanceMonitor] No service worker available');
          });
        }
      }
      
      lastCheckTimeRef.current = now;
    };

    // Set up performance monitoring
    performanceCheckRef.current = setInterval(checkPerformance, checkIntervalSeconds * 1000);
    
    console.log(`[PerformanceMonitor] Started monitoring with ${checkIntervalSeconds}s intervals`);

    return () => {
      if (performanceCheckRef.current) {
        clearInterval(performanceCheckRef.current);
        performanceCheckRef.current = null;
      }
    };
  }, [checkIntervalSeconds, enableLogging]);

  // Monitor for memory issues
  useEffect(() => {
    if (!enableLogging || !('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
        
        // Warn if memory usage is high
        if (usedMB > limitMB * 0.8) {
          console.warn(`[PerformanceMonitor] High memory usage: ${usedMB}MB / ${limitMB}MB`);
        }
        
        // Log memory stats periodically
        if (usedMB > 50) { // Only log if using more than 50MB
          console.log(`[PerformanceMonitor] Memory: ${usedMB}MB used, ${totalMB}MB total, ${limitMB}MB limit`);
        }
      }
    };

    // Check memory every 2 minutes
    const memoryCheckInterval = setInterval(checkMemory, 2 * 60 * 1000);

    return () => {
      clearInterval(memoryCheckInterval);
    };
  }, [enableLogging]);

  // Monitor for long tasks
  useEffect(() => {
    if (!enableLogging || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`[PerformanceMonitor] Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });

      return () => {
        observer.disconnect();
      };
    } catch (error) {
      console.log('[PerformanceMonitor] PerformanceObserver not fully supported');
    }
  }, [enableLogging]);

  return {
    // Could return performance metrics here if needed
  };
};

export default usePerformanceMonitor;
