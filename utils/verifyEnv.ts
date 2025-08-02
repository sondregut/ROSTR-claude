/**
 * Verify environment variables are loaded correctly
 * Updated to be non-throwing for production stability
 */
import Constants from 'expo-constants';
import logger from './logger';

export function verifyEnvironmentVariables() {
  try {
    logger.debug('🔍 Verifying environment variables...');
    
    // Check both process.env and Constants (prioritize Constants.expoConfig.extra)
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (__DEV__) {
      logger.debug('Environment check:');
      logger.debug('- Process.env URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
      logger.debug('- Constants URL:', Constants.expoConfig?.extra?.supabaseUrl ? 'Set' : 'Not set');
      logger.debug('- Final URL:', supabaseUrl ? 'Set' : 'Not set');
      logger.debug('- Final KEY:', supabaseKey ? 'Set' : 'Not set');
    }
    
    if (!supabaseUrl || !supabaseKey) {
      logger.critical('Environment variables missing:', {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      });
      // Don't throw in production - just log the error
      if (__DEV__) {
        console.error('Missing required environment variables. Please check your configuration.');
      }
      return false;
    }
    
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
      logger.warn('Invalid Supabase URL format. Must start with https://');
      return false;
    }
    
    if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
      logger.warn('Invalid Supabase anon key format. Must be a JWT token starting with eyJ');
      return false;
    }
    
    logger.debug('✅ Environment variables verified successfully!');
    return true;
  } catch (error) {
    // Never throw - just log and return false
    logger.error('Error verifying environment variables:', error);
    return false;
  }
}