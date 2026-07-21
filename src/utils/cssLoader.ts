/**
 * CSS Loading Optimization - Phase 2C
 * 
 * Utilities for loading CSS asynchronously and managing critical CSS
 */

// Track loaded stylesheets to avoid duplicates
const loadedStylesheets = new Set<string>();

/**
 * Load CSS file asynchronously without blocking render
 */
export const loadCSS = (href: string, media: string = 'all'): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (loadedStylesheets.has(href)) {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.media = 'print'; // Load with print media to avoid blocking
    
    link.onload = () => {
      // Switch to target media once loaded
      link.media = media;
      loadedStylesheets.add(href);
      resolve();
    };
    
    link.onerror = () => {
      reject(new Error(`Failed to load CSS: ${href}`));
    };
    
    document.head.appendChild(link);
  });
};

/**
 * Load multiple CSS files in parallel
 */
export const loadCSSBundle = async (stylesheets: string[]): Promise<void> => {
  const loadPromises = stylesheets.map(href => loadCSS(href));
  await Promise.all(loadPromises);
};

/**
 * Load CSS for specific route/component
 */
export const loadRouteCSS = async (routeName: string): Promise<void> => {
  const routeStylesheets: Record<string, string[]> = {
    admin: ['/assets/admin-styles.css'],
    dashboard: ['/assets/dashboard-styles.css'],
    events: ['/assets/events-styles.css'],
    profile: ['/assets/profile-styles.css'],
    blogs: ['/assets/blogs-styles.css'],
  };
  
  const stylesheets = routeStylesheets[routeName];
  if (stylesheets) {
    console.log(`[CSS] Loading styles for route: ${routeName}`);
    await loadCSSBundle(stylesheets);
  }
};

/**
 * Preload CSS for likely next routes
 */
export const preloadRouteCSS = (routes: string[]): void => {
  routes.forEach(route => {
    // Use requestIdleCallback if available, otherwise setTimeout
    const preload = () => loadRouteCSS(route).catch(console.warn);
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload);
    } else {
      setTimeout(preload, 100);
    }
  });
};

/**
 * Remove unused CSS (for cleanup)
 */
export const removeCSS = (href: string): void => {
  const links = document.querySelectorAll(`link[href="${href}"]`);
  links.forEach(link => link.remove());
  loadedStylesheets.delete(href);
};

/**
 * Get CSS loading metrics
 */
export const getCSSMetrics = () => {
  return {
    loadedCount: loadedStylesheets.size,
    loadedStylesheets: Array.from(loadedStylesheets),
    totalStylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
  };
};

/**
 * Critical CSS injection utility
 */
export const injectCriticalCSS = (css: string): void => {
  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.insertBefore(style, document.head.firstChild);
};

/**
 * Font loading optimization
 */
export const preloadFonts = (fonts: Array<{ href: string; type?: string }>): void => {
  fonts.forEach(({ href, type = 'font/woff2' }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

/**
 * Responsive image loading
 */
export const preloadImages = (images: string[]): void => {
  images.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

/**
 * Performance monitoring for CSS
 */
export const measureCSSPerformance = () => {
  if ('performance' in window) {
    const cssResources = performance.getEntriesByType('resource')
      .filter((entry: any) => entry.name.endsWith('.css'));
    
    return {
      totalCSSFiles: cssResources.length,
      totalCSSSize: cssResources.reduce((sum: number, entry: any) => sum + (entry.transferSize || 0), 0),
      avgLoadTime: cssResources.reduce((sum: number, entry: any) => sum + entry.duration, 0) / cssResources.length,
      slowestCSS: cssResources.sort((a: any, b: any) => b.duration - a.duration)[0],
    };
  }
  return null;
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    loadedStylesheets.clear();
  });
}
