/**
 * Client-side caching utilities for performance optimization
 */

const CACHE_PREFIX = 'app_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get item from cache
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if expired/not found
 */
export function getCachedItem(key) {
  if (typeof window === 'undefined') return null;
  
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;
    
    const { value, expiry } = JSON.parse(item);
    
    // Check if expired
    if (Date.now() > expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return value;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Set item in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export function setCachedItem(key, value, ttl = DEFAULT_TTL) {
  if (typeof window === 'undefined') return;
  
  try {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Clear all cache items
 */
export function clearCache() {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Debounced localStorage save for cart
 */
let saveCartTimeout = null;

export function debouncedSaveCart(cart, delay = 500) {
  if (saveCartTimeout) {
    clearTimeout(saveCartTimeout);
  }
  
  saveCartTimeout = setTimeout(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, delay);
}
