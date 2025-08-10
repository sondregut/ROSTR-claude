/**
 * Force logging in production for debugging
 * This bypasses all debug mode checks
 */

// Store the original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

// Force enable console logging
export function enableForceLogging() {
  // Restore original console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  
  console.log('🔍 Force logging enabled for debugging');
}

// Helper to force log without any checks
export const forceLog = (...args: any[]) => {
  originalConsole.log('[FORCE LOG]', ...args);
};

export const forceError = (...args: any[]) => {
  originalConsole.error('[FORCE ERROR]', ...args);
};