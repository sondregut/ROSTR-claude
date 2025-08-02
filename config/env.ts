/**
 * Environment configuration with validation
 * This module ensures all required environment variables are present
 * and provides type-safe access to configuration values
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

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validates that a required environment variable exists
 */
function getRequiredEnvVar(key: string): string {
  // First try process.env (for development)
  let value = process.env[key];
  
  // If not found, try expo-constants (for production)
  if (!value && Constants.expoConfig?.extra) {
    // Map EXPO_PUBLIC_ prefixed keys to their config names
    const configKey = key.replace('EXPO_PUBLIC_', '').replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const mappedKey = configKey.charAt(0).toLowerCase() + configKey.slice(1);
    value = Constants.expoConfig.extra[mappedKey];
  }
  
  if (!value || value.trim() === '') {
    throw new ConfigurationError(
      `Missing required environment variable: ${key}\n` +
      `Please ensure your .env file is properly configured.`
    );
  }
  
  // Check for placeholder values
  if (value.includes('your-') || value === 'placeholder') {
    throw new ConfigurationError(
      `Environment variable ${key} contains a placeholder value.\n` +
      `Please update it with your actual configuration.`
    );
  }
  
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function getOptionalEnvVar(key: string, defaultValue: string = ''): string {
  // First try process.env (for development)
  let value = process.env[key];
  
  // If not found, try expo-constants (for production)
  if (!value && Constants.expoConfig?.extra) {
    // Map EXPO_PUBLIC_ prefixed keys to their config names
    const configKey = key.replace('EXPO_PUBLIC_', '').replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const mappedKey = configKey.charAt(0).toLowerCase() + configKey.slice(1);
    value = Constants.expoConfig.extra[mappedKey];
  }
  
  return value || defaultValue;
}

/**
 * Gets a boolean environment variable
 */
function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  // First try process.env (for development)
  let value = process.env[key];
  
  // If not found, try expo-constants (for production)
  if (!value && Constants.expoConfig?.extra) {
    // Map EXPO_PUBLIC_ prefixed keys to their config names
    const configKey = key.replace('EXPO_PUBLIC_', '').replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const mappedKey = configKey.charAt(0).toLowerCase() + configKey.slice(1);
    const configValue = Constants.expoConfig.extra[mappedKey];
    if (typeof configValue === 'boolean') {
      return configValue;
    }
    value = configValue?.toString();
  }
  
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Creates and validates the environment configuration
 */
function createConfig(): EnvironmentConfig {
  // Determine environment
  const env = (getOptionalEnvVar('EXPO_PUBLIC_ENV', 'development') as 'development' | 'staging' | 'production');
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';
  
  // In development, we can be more lenient with missing vars
  const requireInProduction = (key: string, devDefault: string = '') => {
    if (isProduction) {
      return getRequiredEnvVar(key);
    }
    return getOptionalEnvVar(key, devDefault);
  };
  
  const config: EnvironmentConfig = {
    // Supabase configuration (always required)
    supabaseUrl: getRequiredEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: getRequiredEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    
    // Environment
    env,
    isProduction,
    isDevelopment,
    
    // Optional services
    sentryDsn: getOptionalEnvVar('EXPO_PUBLIC_SENTRY_DSN'),
    analyticsEnabled: getBooleanEnvVar('EXPO_PUBLIC_ANALYTICS_ENABLED', isProduction),
    debugMode: getBooleanEnvVar('EXPO_PUBLIC_DEBUG_MODE', isDevelopment),
    
    // Feature flags
    enableTestUsers: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_TEST_USERS', isDevelopment),
    showDevMenu: getBooleanEnvVar('EXPO_PUBLIC_SHOW_DEV_MENU', isDevelopment),
  };
  
  // Validate Supabase URL format
  try {
    const url = new URL(config.supabaseUrl);
    if (!url.hostname.includes('supabase.co') && !url.hostname.includes('supabase.in')) {
      console.warn('Warning: Supabase URL does not appear to be a valid Supabase domain');
    }
  } catch (error) {
    throw new ConfigurationError(`Invalid Supabase URL format: ${config.supabaseUrl}`);
  }
  
  // Validate Supabase anon key format (basic check)
  if (!config.supabaseAnonKey.startsWith('eyJ')) {
    throw new ConfigurationError('Invalid Supabase anon key format');
  }
  
  // Only log configuration in development mode
  if (isDevelopment && config.debugMode) {
    console.log('🔧 Environment Configuration:', {
      env: config.env,
      analyticsEnabled: config.analyticsEnabled,
      debugMode: config.debugMode,
      enableTestUsers: config.enableTestUsers,
      showDevMenu: config.showDevMenu,
    });
  }
  
  return config;
}

// Create and export the configuration
// This will throw an error if required variables are missing
let config: EnvironmentConfig;

try {
  config = createConfig();
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('❌ Configuration Error:', error.message);
    
    // Log current environment for debugging
    console.error('\n🔍 Current Environment:');
    console.error('- NODE_ENV:', process.env.NODE_ENV);
    console.error('- EXPO_PUBLIC_ENV:', process.env.EXPO_PUBLIC_ENV);
    console.error('- Supabase URL present:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.error('- Supabase Key present:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    
    // In development, provide helpful instructions
    if (process.env.NODE_ENV === 'development') {
      console.error('\n📋 Setup Instructions:');
      console.error('1. Copy .env.example to .env');
      console.error('2. Update .env with your Supabase project keys');
      console.error('3. Restart the development server\n');
    } else {
      console.error('\n⚠️  Production Environment Issue:');
      console.error('Environment variables are not properly configured.');
      console.error('Please check your EAS build configuration or environment secrets.');
    }
  }
  throw error;
}

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