/**
 * Sentry error tracking configuration
 * Provides crash reporting and performance monitoring
 */

import { isProduction, isDevelopment, sentryDsn, env } from '@/config/env';

// Lazy load Sentry to avoid initialization errors
let Sentry: any = null;

// Only initialize Sentry if we have a DSN configured
export const initSentry = () => {
  if (!sentryDsn) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }
  
  try {
    // Lazy load Sentry
    Sentry = require('@sentry/react-native');
  } catch (error) {
    console.log('Sentry not available in this environment');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: env,
      debug: isDevelopment,
      
      // Release tracking
      release: '1.0.0', // TODO: Get from app.json
      dist: '1',
      
      // Performance monitoring
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in development
      
      // Session tracking
      autoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000, // 30 seconds
      
      // Error filtering
      beforeSend: (event, hint) => {
        // Filter out non-critical errors in production
        if (isProduction) {
          // Ignore network errors that are expected
          if (event.exception?.values?.[0]?.type === 'NetworkError') {
            return null;
          }
          
          // Ignore cancelled promises
          if (event.exception?.values?.[0]?.value?.includes('cancelled')) {
            return null;
          }
        }
        
        // Log to console in development
        if (isDevelopment) {
          console.error('Sentry Event:', event, hint);
        }
        
        return event;
      },
      
      // Breadcrumb filtering
      beforeBreadcrumb: (breadcrumb) => {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }
        
        // Sanitize sensitive data from breadcrumbs
        if (breadcrumb.data) {
          // Remove potential passwords or tokens
          const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization'];
          sensitiveKeys.forEach(key => {
            if (breadcrumb.data && breadcrumb.data[key]) {
              breadcrumb.data[key] = '[REDACTED]';
            }
          });
        }
        
        return breadcrumb;
      },
      
      // Integrations
      integrations: [
        new Sentry.ReactNativeTracing({
          // Trace navigation
          routingInstrumentation: null, // TODO: Add navigation instrumentation
          
          // Trace HTTP requests
          tracingOrigins: [
            'localhost',
            /^https:\/\/.*\.supabase\.co\/rest/,
            /^https:\/\/.*\.supabase\.co\/auth/,
            /^https:\/\/.*\.supabase\.co\/storage/,
          ],
          
          // Performance options
          idleTimeout: 3000,
          maxTransactionDuration: 600, // 10 minutes
        }),
      ],
      
      // Attachments
      attachStacktrace: true,
      attachThreads: true,
      
      // User privacy
      // Don't send user IP addresses
      sendDefaultPii: false,
    });

    console.log('✅ Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

// Error context enrichment
export const setSentryUser = (user: any) => {
  if (!sentryDsn || !Sentry) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
};

// Add contextual information
export const setSentryContext = (key: string, context: any) => {
  if (!sentryDsn || !Sentry) return;
  Sentry.setContext(key, context);
};

// Add tags for filtering
export const setSentryTag = (key: string, value: string) => {
  if (!sentryDsn || !Sentry) return;
  Sentry.setTag(key, value);
};

// Add breadcrumb for debugging
export const addBreadcrumb = (message: string, data?: any, category?: string) => {
  if (!sentryDsn || !Sentry) return;
  
  Sentry.addBreadcrumb({
    message,
    data,
    category: category || 'custom',
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

// Capture handled exceptions
export const captureException = (error: Error, context?: any) => {
  if (!sentryDsn || !Sentry) {
    console.error('Captured exception (Sentry not configured):', error, context);
    return;
  }
  
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext('error_context', context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

// Capture messages (non-error events)
export const captureMessage = (message: string, level: string = 'info') => {
  if (!sentryDsn || !Sentry) {
    console.log('Captured message (Sentry not configured):', message);
    return;
  }
  
  Sentry.captureMessage(message, level);
};

// Performance monitoring
export const startTransaction = (name: string, op: string = 'navigation') => {
  if (!sentryDsn || !Sentry) return null;
  
  return Sentry.startTransaction({
    name,
    op,
  });
};

// Wrap async functions with error handling
export const withSentry = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: { 
    context?: string;
    tags?: Record<string, string>;
  }
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        captureException(error, {
          function: fn.name,
          arguments: args,
          ...options,
        });
      }
      throw error;
    }
  }) as T;
};

// React Error Boundary integration
export const sentryErrorBoundary = Sentry?.ErrorBoundary;

// Navigation integration helper
export const navigationIntegration = null; // TODO: Add when Sentry is properly configured

// Export Sentry instance for advanced usage
export { Sentry };