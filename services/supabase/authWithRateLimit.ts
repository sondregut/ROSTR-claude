import { supabase } from '@/lib/supabase';
import { AuthError, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import rateLimiter from '@/services/rateLimiter';
import { log } from '@/services/logger';
import { simpleAuth } from './simpleAuth';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface AppleAuthData {
  identityToken: string;
  user?: string | null;
  email?: string | null;
  fullName?: AppleAuthentication.AppleAuthenticationFullName | null;
}

/**
 * Enhanced authentication service with rate limiting
 * Prevents brute force attacks and abuse
 */
class AuthServiceWithRateLimit {
  /**
   * Sign up with email and password (rate limited)
   */
  async signUpWithEmail(email: string, password: string, fullName?: string): Promise<AuthResult> {
    try {
      // Check rate limit
      const limitResult = await rateLimiter.checkLimit('signup', email);
      if (!limitResult.allowed) {
        const errorMessage = rateLimiter.getErrorMessage(limitResult);
        log.warn('Signup rate limit exceeded', { email, limitResult }, 'Auth');
        return {
          user: null,
          session: null,
          error: new AuthError(errorMessage, 429),
        };
      }

      log.info('Creating account with email', { email }, 'Auth');
      
      const result = await simpleAuth.signUpWithEmail(email, password, fullName);
      
      // Record attempt on failure
      if (result.error) {
        await rateLimiter.recordAttempt('signup', email);
        log.error('Sign up failed', result.error, 'Auth');
      } else {
        // Clear rate limit on success
        await rateLimiter.clearLimit('signup', email);
        log.info('Account created successfully', { userId: result.user?.id }, 'Auth');
      }
      
      return result;
    } catch (error: any) {
      log.error('Unexpected sign up error', error, 'Auth');
      return { 
        user: null, 
        session: null, 
        error: new AuthError(error.message || 'Failed to create account', error.status || 500)
      };
    }
  }

  /**
   * Sign in with email and password (rate limited)
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      // Check rate limit
      const limitResult = await rateLimiter.checkLimit('login', email);
      if (!limitResult.allowed) {
        const errorMessage = rateLimiter.getErrorMessage(limitResult);
        log.warn('Login rate limit exceeded', { email, limitResult }, 'Auth');
        return {
          user: null,
          session: null,
          error: new AuthError(errorMessage, 429),
        };
      }

      log.info('Signing in with email', { email }, 'Auth');
      
      const result = await simpleAuth.signInWithEmail(email, password);
      
      // Record attempt on failure
      if (result.error) {
        await rateLimiter.recordAttempt('login', email);
        log.error('Sign in failed', result.error, 'Auth');
        
        // Add remaining attempts info to error message
        const newLimitResult = await rateLimiter.checkLimit('login', email);
        if (newLimitResult.remainingAttempts !== undefined && newLimitResult.remainingAttempts > 0) {
          const attemptsMessage = `${newLimitResult.remainingAttempts} attempt${newLimitResult.remainingAttempts > 1 ? 's' : ''} remaining`;
          result.error.message = `${result.error.message}. ${attemptsMessage}`;
        }
      } else {
        // Clear rate limit on success
        await rateLimiter.clearLimit('login', email);
        log.info('Signed in successfully', { userId: result.user?.id }, 'Auth');
      }
      
      return result;
    } catch (error: any) {
      log.error('Unexpected sign in error', error, 'Auth');
      return { 
        user: null, 
        session: null, 
        error: new AuthError(error.message || 'Failed to sign in', error.status || 500)
      };
    }
  }

  /**
   * Sign in with Apple (rate limited by device)
   */
  async signInWithApple(authData: AppleAuthData): Promise<AuthResult> {
    try {
      // Rate limit by device ID (Apple Sign In is device-specific)
      const deviceId = await this.getDeviceId();
      const limitResult = await rateLimiter.checkLimit('login', `apple:${deviceId}`);
      
      if (!limitResult.allowed) {
        const errorMessage = rateLimiter.getErrorMessage(limitResult);
        log.warn('Apple login rate limit exceeded', { limitResult }, 'Auth');
        return {
          user: null,
          session: null,
          error: new AuthError(errorMessage, 429),
        };
      }

      log.info('Signing in with Apple', undefined, 'Auth');
      
      const result = await simpleAuth.signInWithApple(authData);
      
      if (result.error) {
        await rateLimiter.recordAttempt('login', `apple:${deviceId}`);
        log.error('Apple sign in failed', result.error, 'Auth');
      } else {
        await rateLimiter.clearLimit('login', `apple:${deviceId}`);
        log.info('Apple sign in successful', { userId: result.user?.id }, 'Auth');
      }
      
      return result;
    } catch (error: any) {
      log.error('Unexpected Apple sign in error', error, 'Auth');
      return { 
        user: null, 
        session: null, 
        error: new AuthError(error.message || 'Failed to sign in with Apple', error.status || 500)
      };
    }
  }

  /**
   * Reset password (rate limited)
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      // Check rate limit
      const limitResult = await rateLimiter.checkLimit('passwordReset', email);
      if (!limitResult.allowed) {
        const errorMessage = rateLimiter.getErrorMessage(limitResult);
        log.warn('Password reset rate limit exceeded', { email, limitResult }, 'Auth');
        return {
          error: new AuthError(errorMessage, 429),
        };
      }

      log.info('Requesting password reset', { email }, 'Auth');
      
      const result = await simpleAuth.resetPassword(email);
      
      // Always record attempt for password reset (to prevent email enumeration)
      await rateLimiter.recordAttempt('passwordReset', email);
      
      if (result.error) {
        log.error('Password reset failed', result.error, 'Auth');
      } else {
        log.info('Password reset email sent', { email }, 'Auth');
      }
      
      return result;
    } catch (error: any) {
      log.error('Unexpected password reset error', error, 'Auth');
      return { 
        error: new AuthError(error.message || 'Failed to reset password', error.status || 500)
      };
    }
  }

  /**
   * Verify OTP (rate limited)
   */
  async verifyOtp(email: string, token: string, type: 'sms' | 'email' = 'email'): Promise<AuthResult> {
    try {
      // Check rate limit
      const limitResult = await rateLimiter.checkLimit('verifyOtp', email);
      if (!limitResult.allowed) {
        const errorMessage = rateLimiter.getErrorMessage(limitResult);
        log.warn('OTP verification rate limit exceeded', { email, limitResult }, 'Auth');
        return {
          user: null,
          session: null,
          error: new AuthError(errorMessage, 429),
        };
      }

      log.info('Verifying OTP', { email, type }, 'Auth');
      
      const result = await simpleAuth.verifyOtp(email, token, type);
      
      if (result.error) {
        await rateLimiter.recordAttempt('verifyOtp', email);
        log.error('OTP verification failed', result.error, 'Auth');
      } else {
        await rateLimiter.clearLimit('verifyOtp', email);
        log.info('OTP verified successfully', { userId: result.user?.id }, 'Auth');
      }
      
      return result;
    } catch (error: any) {
      log.error('Unexpected OTP verification error', error, 'Auth');
      return { 
        user: null, 
        session: null, 
        error: new AuthError(error.message || 'Failed to verify OTP', error.status || 500)
      };
    }
  }

  /**
   * Gets a unique device identifier for rate limiting
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('@device_id');
      if (!deviceId) {
        // Generate a new device ID
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('@device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      log.error('Failed to get device ID', error, 'Auth');
      return 'unknown_device';
    }
  }

  /**
   * Sign out (clears rate limits)
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      log.info('Signing out', undefined, 'Auth');
      
      const result = await simpleAuth.signOut();
      
      if (!result.error) {
        // Clean up rate limiter on successful logout
        await rateLimiter.cleanup();
        log.info('Signed out successfully', undefined, 'Auth');
      }
      
      return result;
    } catch (error: any) {
      log.error('Unexpected sign out error', error, 'Auth');
      return { 
        error: new AuthError(error.message || 'Failed to sign out', error.status || 500)
      };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    return simpleAuth.getSession();
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return simpleAuth.onAuthStateChange(callback);
  }
}

// Create singleton instance
const authService = new AuthServiceWithRateLimit();

// Export as default
export default authService;