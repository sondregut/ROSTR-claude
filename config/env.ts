/**
 * Environment configuration for the app
 * Centralizes access to environment variables with validation
 */

export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  
  // App Configuration
  APP_ENV: process.env.NODE_ENV || 'development',
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  DEBUG_MODE: __DEV__,
} as const;

/**
 * Validates that all required environment variables are present
 * Call this at app startup to fail fast if configuration is missing
 */
export const validateEnv = () => {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ] as const;
  
  const missing = requiredVars.filter(key => !ENV[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing
        .map(key => `- EXPO_PUBLIC_${key}`)
        .join('\n')}\n\nPlease check your .env file.`
    );
  }
};

/**
 * Runtime check if we're in development mode
 */
export const isDevelopment = () => ENV.APP_ENV === 'development' || ENV.DEBUG_MODE;

/**
 * Runtime check if we're in production mode
 */
export const isProduction = () => ENV.APP_ENV === 'production' && !ENV.DEBUG_MODE;