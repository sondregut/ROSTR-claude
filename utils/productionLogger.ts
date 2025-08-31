/**
 * Production-safe logging utility
 * Only logs in development/debug mode, removes logs in production
 */

import { isDevelopment, debugMode } from '@/config/env';

interface Logger {
  log: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
}

const createLogger = (): Logger => {
  const shouldLog = isDevelopment || debugMode;
  
  return {
    log: shouldLog ? console.log.bind(console) : () => {},
    debug: shouldLog ? console.debug?.bind(console) || console.log.bind(console) : () => {},
    warn: console.warn.bind(console), // Always show warnings
    error: console.error.bind(console), // Always show errors
    info: shouldLog ? console.info?.bind(console) || console.log.bind(console) : () => {},
  };
};

export const logger = createLogger();
export default logger;