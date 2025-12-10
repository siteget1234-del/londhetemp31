/**
 * Web Vitals monitoring for performance tracking
 */

export function reportWebVitals(metric) {
  if (process.env.NODE_ENV === 'production') {
    // Log to console in development
    console.log(metric);
    
    // In production, you can send to analytics service
    // Example: sendToAnalytics(metric);
  }
}

/**
 * Custom performance metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  start(label) {
    this.metrics.set(label, performance.now());
  }

  end(label) {
    const startTime = this.metrics.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      this.metrics.delete(label);
      return duration;
    }
    return 0;
  }

  measure(label, callback) {
    this.start(label);
    const result = callback();
    this.end(label);
    return result;
  }

  async measureAsync(label, callback) {
    this.start(label);
    const result = await callback();
    this.end(label);
    return result;
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Mark important user interactions
 */
export function markInteraction(name) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name);
  }
}

/**
 * Measure time between two marks
 */
export function measureBetweenMarks(name, startMark, endMark) {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      console.log(`[Measure] ${name}: ${measure.duration.toFixed(2)}ms`);
      return measure.duration;
    } catch (e) {
      console.error('Error measuring performance:', e);
    }
  }
  return 0;
}
