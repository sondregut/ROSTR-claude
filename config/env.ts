/**
 * Environment configuration
 * Simplified to read directly from Constants.expoConfig.extra
 * which contains hardcoded values from app.config.js
 */

import Constants from 'expo-constants';

interface EnvironmentConfig {
  // Required Supabase configuration
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Environment info
  env: 'development' | 'staging' | 'production';
  isProduction: boolean;
  isDevelopment: boolean;
  
  // Optional features
  sentryDsn?: string;
  analyticsEnabled: boolean;
  debugMode: boolean;
  
  // Feature flags
  enableTestUsers: boolean;
  showDevMenu: boolean;
}

/**
 * Creates the environment configuration from hardcoded values in app.config.js
 */
function createConfig(): EnvironmentConfig {
  // Get values from Constants.expoConfig.extra (hardcoded in app.config.js)
  const extra = Constants.expoConfig?.extra || {};
  
  // Use hardcoded values with fallbacks for safety
  const supabaseUrl = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const env = (extra.env || process.env.EXPO_PUBLIC_ENV || 'production') as 'development' | 'staging' | 'production';
  
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';
  
  const config: EnvironmentConfig = {
    // Supabase configuration
    supabaseUrl,
    supabaseAnonKey,
    
    // Environment
    env,
    isProduction,
    isDevelopment,
    
    // Optional services (with safe defaults)
    sentryDsn: extra.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
    analyticsEnabled: extra.analyticsEnabled ?? (process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true') ?? true,
    debugMode: extra.debugMode ?? (process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') ?? false,
    
    // Feature flags (with safe defaults)
    enableTestUsers: extra.enableTestUsers ?? (process.env.EXPO_PUBLIC_ENABLE_TEST_USERS === 'true') ?? false,
    showDevMenu: extra.showDevMenu ?? (process.env.EXPO_PUBLIC_SHOW_DEV_MENU === 'true') ?? false,
  };
  
  // Only log configuration in development mode
  if (isDevelopment && config.debugMode) {
    console.log('🔧 Environment Configuration:', {
      env: config.env,
      analyticsEnabled: config.analyticsEnabled,
      debugMode: config.debugMode,
      enableTestUsers: config.enableTestUsers,
      showDevMenu: config.showDevMenu,
      supabaseUrlPresent: !!config.supabaseUrl,
      supabaseKeyPresent: !!config.supabaseAnonKey,
    });
  }
  
  // Log warnings if critical values are missing (but don't crash)
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn('⚠️  Warning: Supabase configuration is missing. App may not function correctly.');
    console.warn('- Supabase URL:', config.supabaseUrl ? 'Present' : 'Missing');
    console.warn('- Supabase Key:', config.supabaseAnonKey ? 'Present' : 'Missing');
  }
  
  return config;
}

// Create and export the configuration
const config = createConfig();

export default config;

// Export specific configuration values for convenience
export const {
  supabaseUrl,
  supabaseAnonKey,
  env,
  isProduction,
  isDevelopment,
  sentryDsn,
  analyticsEnabled,
  debugMode,
  enableTestUsers,
  showDevMenu,
} = config;