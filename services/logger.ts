/**
 * Centralized logging service
 * Replaces console.log with proper logging that can be disabled in production
 * and sent to error tracking services
 */

import { isProduction, debugMode } from '@/config/env';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  context?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory for debugging

  /**
   * Determines if a log should be shown based on environment
   */
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (isProduction) {
      return level === LogLevel.WARN || level === LogLevel.ERROR;
    }
    
    // In development with debug mode off, skip debug logs
    if (!debugMode && level === LogLevel.DEBUG) {
      return false;
    }
    
    return true;
  }

  /**
   * Formats the log message for console output
   */
  private formatMessage(entry: LogEntry): string {
    const prefix = entry.context ? `[${entry.context}]` : '';
    return `${prefix} ${entry.message}`;
  }

  /**
   * Adds a log entry and outputs to console if appropriate
   */
  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      context,
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console if appropriate
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.log('🔍', formattedMessage, data || '');
        break;
      case LogLevel.INFO:
        console.log('ℹ️', formattedMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn('⚠️', formattedMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error('❌', formattedMessage, data || '');
        break;
    }

    // In production, send errors to monitoring service
    if (isProduction && level === LogLevel.ERROR) {
      this.sendToErrorTracking(entry);
    }
  }

  /**
   * Sends error logs to error tracking service (Sentry, etc.)
   */
  private sendToErrorTracking(entry: LogEntry) {
    // TODO: Implement Sentry integration
    // For now, just ensure errors are visible
    console.error('Production Error:', {
      message: entry.message,
      data: entry.data,
      context: entry.context,
      timestamp: entry.timestamp,
    });
  }

  // Public logging methods
  debug(message: string, data?: any, context?: string) {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log(LogLevel.INFO, message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log(LogLevel.WARN, message, data, context);
  }

  error(message: string, error?: any, context?: string) {
    // Extract error details if it's an Error object
    let errorData = error;
    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...error,
      };
    }
    
    this.log(LogLevel.ERROR, message, errorData, context);
  }

  /**
   * Gets recent logs (useful for debugging)
   */
  getRecentLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clears all stored logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Groups related logs together
   */
  group(label: string) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.shouldLog(LogLevel.INFO)) {
      console.groupEnd();
    }
  }

  /**
   * Measures performance
   */
  time(label: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance
export default logger;

// Export convenience functions for easy migration from console.log
export const log = {
  debug: (message: string, data?: any, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?: any, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?: any, context?: string) => logger.warn(message, data, context),
  error: (message: string, error?: any, context?: string) => logger.error(message, error, context),
};

// Development-only logging (completely removed in production)
export const devLog = {
  debug: (message: string, data?: any, context?: string) => {
    if (!isProduction) {
      logger.debug(message, data, context);
    }
  },
  info: (message: string, data?: any, context?: string) => {
    if (!isProduction) {
      logger.info(message, data, context);
    }
  },
  trace: (message: string, data?: any) => {
    if (!isProduction && debugMode) {
      console.trace(message, data);
    }
  },
  table: (data: any) => {
    if (!isProduction && debugMode) {
      console.table(data);
    }
  },
};