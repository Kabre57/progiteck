interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Observer pour les métriques de navigation
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration);
        }
      });

      try {
        navObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
    };
  }

  recordMetric(name: string, duration: number): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    });

    // Garder seulement les 1000 dernières métriques
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    // Log les opérations lentes
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageTime(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  exportMetrics(): void {
    const data = {
      metrics: this.metrics,
      summary: {
        totalOperations: this.metrics.length,
        averageTime: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
        slowOperations: this.metrics.filter(m => m.duration > 1000).length
      },
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook pour mesurer les performances des composants
export function usePerformanceTimer(name: string) {
  const timer = performanceMonitor.startTimer(name);
  
  return {
    stop: timer,
    recordMetric: (metricName: string, duration: number) => 
      performanceMonitor.recordMetric(metricName, duration)
  };
}

// Décorateur pour mesurer les performances des fonctions
export function measurePerformance(name: string) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    
    if (originalMethod) {
      descriptor.value = function (...args: Parameters<T>) {
        const timer = performanceMonitor.startTimer(`${name}.${propertyKey}`);
        
        try {
          const result = originalMethod.apply(this, args);
          
          // Si c'est une promesse, attendre qu'elle se résolve
          if (result instanceof Promise) {
            return result.finally(() => timer());
          }
          
          timer();
          return result;
        } catch (error) {
          timer();
          throw error;
        }
      } as T;
    }
    
    return descriptor;
  };
}

export default performanceMonitor;