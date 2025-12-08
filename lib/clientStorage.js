/**
 * Client-side storage utilities with SSR safety
 * Prevents localStorage errors during server-side rendering
 */

/**
 * Check if code is running on client side
 */
export const isClient = () => typeof window !== 'undefined';

/**
 * Safely get item from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Parsed value or default
 */
export const getLocalStorage = (key, defaultValue = null) => {
  if (!isClient()) return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely set item in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} Success status
 */
export const setLocalStorage = (key, value) => {
  if (!isClient()) return false;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const removeLocalStorage = (key) => {
  if (!isClient()) return false;
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely clear all localStorage
 * @returns {boolean} Success status
 */
export const clearLocalStorage = () => {
  if (!isClient()) return false;
  
  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Get item from sessionStorage with SSR safety
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value
 * @returns {any} Parsed value or default
 */
export const getSessionStorage = (key, defaultValue = null) => {
  if (!isClient()) return defaultValue;
  
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading sessionStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Set item in sessionStorage with SSR safety
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} Success status
 */
export const setSessionStorage = (key, value) => {
  if (!isClient()) return false;
  
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting sessionStorage key "${key}":`, error);
    return false;
  }
};
