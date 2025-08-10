/**
 * Enhanced logging utility with production debugging support
 * Allows debugging in production when EXPO_PUBLIC_DEBUG_MODE is true
 */

import { debugMode } from '../config/env';

const isDev = __DEV__;
const isDebugMode = debugMode || isDev;

// Store recent logs for debugging
const recentLogs: Array<{ type: string; timestamp: string; args: any[] }> = [];
const MAX_LOGS = 100;

// Track recursion depth to prevent stack overflow
const recursionDepth = new Map<string, number>();
const MAX_RECURSION_DEPTH = 3;

// Circuit breaker for error logging
let errorLogFailures = 0;
const MAX_ERROR_FAILURES = 5;
let errorLogDisabled = false;

function addToRecentLogs(type: string, args: any[]) {
  try {
    // Prevent infinite recursion in log storage
    if (recentLogs.length >= MAX_LOGS * 2) {
      recentLogs.length = 0; // Clear if somehow we exceed double the limit
    }
    
    recentLogs.push({
      type,
      timestamp: new Date().toISOString(),
      args: args.map(arg => {
        // Safe serialization of arguments
        try {
          if (arg === null || arg === undefined) return String(arg);
          if (typeof arg === 'object') {
            // Avoid circular references
            return JSON.stringify(arg, (key, value) => {
              if (typeof value === 'object' && value !== null) {
                // Limit object depth
                return Object.keys(value).length > 10 ? '[Large Object]' : value;
              }
              return value;
            });
          }
          return String(arg);
        } catch {
          return '[Unserializable]';
        }
      })
    });
    
    // Keep only the last MAX_LOGS entries
    if (recentLogs.length > MAX_LOGS) {
      recentLogs.shift();
    }
  } catch {
    // Silently fail if log storage fails
  }
}

// Safe console wrapper to prevent errors in production
function safeConsoleCall(method: string, ...args: any[]) {
  try {
    // Track recursion depth
    const callId = new Error().stack?.split('\n')[3] || 'unknown';
    const depth = (recursionDepth.get(callId) || 0) + 1;
    
    if (depth > MAX_RECURSION_DEPTH) {
      return; // Prevent stack overflow
    }
    
    recursionDepth.set(callId, depth);
    
    // Call the console method
    (console as any)[method](...args);
    
    // Clear recursion tracking after successful call
    setTimeout(() => recursionDepth.delete(callId), 100);
  } catch (error) {
    // If console fails, track it but don't recurse
    if (method === 'error') {
      errorLogFailures++;
      if (errorLogFailures >= MAX_ERROR_FAILURES) {
        errorLogDisabled = true;
      }
    }
  }
}

export const logger = {
  log: (...args: any[]) => {
    if (isDebugMode) {
      safeConsoleCall('log', ...args);
      addToRecentLogs('log', args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors in production for debugging, but with circuit breaker
    if (!errorLogDisabled) {
      safeConsoleCall('error', ...args);
      addToRecentLogs('error', args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDebugMode) {
      safeConsoleCall('warn', ...args);
      addToRecentLogs('warn', args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDebugMode) {
      safeConsoleCall('info', ...args);
      addToRecentLogs('info', args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDebugMode) {
      safeConsoleCall('debug', ...args);
      addToRecentLogs('debug', args);
    }
  },
  
  // Always log critical errors even in production
  critical: (...args: any[]) => {
    if (!errorLogDisabled) {
      safeConsoleCall('error', '[CRITICAL]', ...args);
      addToRecentLogs('critical', args);
    }
  },
  
  // Production-safe error reporting
  reportError: (error: Error, context?: any) => {
    try {
      const errorInfo = {
        message: error?.message || 'Unknown error',
        stack: error?.stack?.substring(0, 1000), // Limit stack trace size
        context: context ? JSON.stringify(context).substring(0, 500) : undefined,
        timestamp: new Date().toISOString(),
        environment: isDev ? 'development' : 'production',
        debugMode: isDebugMode
      };
      
      if (!errorLogDisabled) {
        safeConsoleCall('error', '[ERROR REPORT]', errorInfo);
        addToRecentLogs('error-report', [errorInfo]);
      }
    } catch {
      // Silently fail if error reporting fails
    }
  },
  
  // Get recent logs for debugging
  getRecentLogs: () => {
    try {
      return [...recentLogs];
    } catch {
      return [];
    }
  },
  
  // Clear log history
  clearLogs: () => {
    try {
      recentLogs.length = 0;
      recursionDepth.clear();
      errorLogFailures = 0;
      errorLogDisabled = false;
    } catch {
      // Silently fail
    }
  }
};

export default logger;