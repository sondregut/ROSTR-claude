/**
 * Client-side rate limiting for authentication and sensitive operations
 * Helps prevent brute force attacks and abuse
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from './logger';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after exceeding limit
}

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private readonly STORAGE_PREFIX = '@rate_limit:';
  
  // Default configurations for different operations
  private readonly configs: Record<string, RateLimitConfig> = {
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    signup: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    },
    passwordReset: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    },
    verifyOtp: {
      maxAttempts: 5,
      windowMs: 5 * 60 * 1000, // 5 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
    },
    apiRequest: {
      maxAttempts: 100,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes
    },
  };

  /**
   * Gets the storage key for a specific operation and identifier
   */
  private getStorageKey(operation: string, identifier: string): string {
    return `${this.STORAGE_PREFIX}${operation}:${identifier}`;
  }

  /**
   * Loads rate limit data from storage
   */
  private async loadEntry(key: string): Promise<RateLimitEntry | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      log.error('Failed to load rate limit entry', error, 'RateLimiter');
      return null;
    }
  }

  /**
   * Saves rate limit data to storage
   */
  private async saveEntry(key: string, entry: RateLimitEntry): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      log.error('Failed to save rate limit entry', error, 'RateLimiter');
    }
  }

  /**
   * Clears rate limit data
   */
  private async clearEntry(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      log.error('Failed to clear rate limit entry', error, 'RateLimiter');
    }
  }

  /**
   * Checks if an operation is allowed based on rate limits
   */
  async checkLimit(
    operation: keyof typeof RateLimiter.prototype.configs,
    identifier: string = 'global'
  ): Promise<{
    allowed: boolean;
    remainingAttempts?: number;
    resetTime?: Date;
    blockedUntil?: Date;
  }> {
    const config = this.configs[operation];
    if (!config) {
      log.warn(`No rate limit config for operation: ${operation}`, undefined, 'RateLimiter');
      return { allowed: true };
    }

    const key = this.getStorageKey(operation, identifier);
    const entry = await this.loadEntry(key);
    const now = Date.now();

    // Check if blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        blockedUntil: new Date(entry.blockedUntil),
        remainingAttempts: 0,
      };
    }

    // Check if outside time window (reset)
    if (entry && now - entry.firstAttemptTime > config.windowMs) {
      await this.clearEntry(key);
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
      };
    }

    // Check current attempts
    const currentAttempts = entry?.attempts || 0;
    const remainingAttempts = Math.max(0, config.maxAttempts - currentAttempts);

    if (currentAttempts >= config.maxAttempts) {
      // Block the user
      const blockedUntil = now + config.blockDurationMs;
      await this.saveEntry(key, {
        ...entry!,
        blockedUntil,
      });

      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: new Date(blockedUntil),
      };
    }

    return {
      allowed: true,
      remainingAttempts,
      resetTime: entry ? new Date(entry.firstAttemptTime + config.windowMs) : undefined,
    };
  }

  /**
   * Records an attempt for rate limiting
   */
  async recordAttempt(
    operation: keyof typeof RateLimiter.prototype.configs,
    identifier: string = 'global'
  ): Promise<void> {
    const config = this.configs[operation];
    if (!config) return;

    const key = this.getStorageKey(operation, identifier);
    const entry = await this.loadEntry(key);
    const now = Date.now();

    if (!entry || now - entry.firstAttemptTime > config.windowMs) {
      // Start new window
      await this.saveEntry(key, {
        attempts: 1,
        firstAttemptTime: now,
      });
    } else {
      // Increment attempts
      await this.saveEntry(key, {
        ...entry,
        attempts: entry.attempts + 1,
      });
    }

    log.debug(`Rate limit attempt recorded for ${operation}`, { identifier }, 'RateLimiter');
  }

  /**
   * Clears rate limit for a specific operation and identifier
   */
  async clearLimit(
    operation: keyof typeof RateLimiter.prototype.configs,
    identifier: string = 'global'
  ): Promise<void> {
    const key = this.getStorageKey(operation, identifier);
    await this.clearEntry(key);
    log.debug(`Rate limit cleared for ${operation}`, { identifier }, 'RateLimiter');
  }

  /**
   * Gets human-readable error message for rate limit
   */
  getErrorMessage(result: Awaited<ReturnType<typeof this.checkLimit>>): string {
    if (result.allowed) return '';

    if (result.blockedUntil) {
      const minutes = Math.ceil((result.blockedUntil.getTime() - Date.now()) / 60000);
      return `Too many attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
    }

    if (result.remainingAttempts === 0) {
      return 'Maximum attempts exceeded. Please try again later.';
    }

    return `You have ${result.remainingAttempts} attempt${result.remainingAttempts > 1 ? 's' : ''} remaining.`;
  }

  /**
   * Middleware for rate limiting async functions
   */
  withRateLimit<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    operation: keyof typeof RateLimiter.prototype.configs,
    getIdentifier?: (...args: Parameters<T>) => string
  ): T {
    return (async (...args: Parameters<T>) => {
      const identifier = getIdentifier ? getIdentifier(...args) : 'global';
      
      // Check rate limit
      const limitResult = await this.checkLimit(operation, identifier);
      if (!limitResult.allowed) {
        const error = new Error(this.getErrorMessage(limitResult));
        (error as any).code = 'RATE_LIMIT_EXCEEDED';
        (error as any).rateLimitResult = limitResult;
        throw error;
      }

      try {
        // Execute the function
        const result = await fn(...args);
        return result;
      } catch (error) {
        // Record attempt on failure
        await this.recordAttempt(operation, identifier);
        throw error;
      }
    }) as T;
  }

  /**
   * Cleans up old rate limit entries
   */
  async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      
      for (const key of rateLimitKeys) {
        const entry = await this.loadEntry(key);
        if (!entry) continue;

        const now = Date.now();
        const operation = key.split(':')[1];
        const config = this.configs[operation];
        
        if (!config) {
          await this.clearEntry(key);
          continue;
        }

        // Clear if outside window and not blocked
        if (now - entry.firstAttemptTime > config.windowMs && 
            (!entry.blockedUntil || entry.blockedUntil < now)) {
          await this.clearEntry(key);
        }
      }

      log.debug('Rate limiter cleanup completed', { cleaned: rateLimitKeys.length }, 'RateLimiter');
    } catch (error) {
      log.error('Rate limiter cleanup failed', error, 'RateLimiter');
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Export instance
export default rateLimiter;

// Export types
export type { RateLimitConfig, RateLimitEntry };