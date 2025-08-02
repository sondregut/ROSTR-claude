/**
 * Verify environment variables are loaded correctly
 */
import Constants from 'expo-constants';
import logger from './logger';

export function verifyEnvironmentVariables() {
  logger.debug('🔍 Verifying environment variables...');
  
  // Check both process.env and Constants
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;
  
  if (__DEV__) {
    logger.debug('Environment check:');
    logger.debug('- Process.env URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
    logger.debug('- Constants URL:', Constants.expoConfig?.extra?.supabaseUrl ? 'Set' : 'Not set');
    logger.debug('- Final URL:', supabaseUrl ? 'Set' : 'Not set');
    logger.debug('- Final KEY:', supabaseKey ? 'Set' : 'Not set');
  }
  
  if (!supabaseUrl || !supabaseKey) {
    const error = new Error('Missing required environment variables. Please check your configuration.');
    logger.critical('Environment variables missing:', {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
    });
    throw error;
  }
  
  if (!supabaseUrl.startsWith('https://')) {
    throw new Error('Invalid Supabase URL format. Must start with https://');
  }
  
  if (!supabaseKey.startsWith('eyJ')) {
    throw new Error('Invalid Supabase anon key format. Must be a JWT token starting with eyJ');
  }
  
  logger.debug('✅ Environment variables verified successfully!');
  return true;
}