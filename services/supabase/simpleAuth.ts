import { supabase } from '@/lib/supabase';
import { AuthError, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';

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

class SimpleAuthService {
  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, fullName?: string): Promise<AuthResult> {
    try {
      console.log('📧 Creating account with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            email_verified: false,
          }
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { user: null, session: null, error };
      }

      console.log('✅ Account created successfully');
      console.log('📊 Signup data:', { 
        user: data.user?.id, 
        email: data.user?.email,
        session: !!data.session,
        sessionToken: data.session?.access_token ? 'Present' : 'Missing'
      });
      return { user: data.user, session: data.session, error: null };
    } catch (error: any) {
      console.error('❌ Unexpected sign up error:', error);
      return { 
        user: null, 
        session: null, 
        error: new AuthError(error.message || 'Failed to create account', error.status || 500)
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 Signing in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { user: null, session: null, error };
      }

      console.log('✅ Signed in successfully');
      return { user: data.user, session: data.session, error: null };
    } catch (error: any) {
      console.error('❌ Unexpected sign in error:', error);
      return { 
        user: null, 
        session: null, 
        error: new AuthError(error.message || 'Failed to sign in', error.status || 500)
      };
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(authData: AppleAuthData): Promise<AuthResult> {
    try {
      console.log('🍎 Signing in with Apple');
      
      // Extract name if available
      let fullName = '';
      if (authData.fullName) {
        const names = [
          authData.fullName.givenName,
          authData.fullName.familyName
        ].filter(Boolean);
        fullName = names.join(' ');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: authData.identityToken,
        options: {
          data: {
            full_name: fullName || undefined,
            email: authData.email || undefined,
          }
        }
      });

      if (error) {
        console.error('❌ Apple sign in error:', error);
        return { user: null, session: null, error };
      }

      console.log('✅ Apple sign in successful');
      return { user: data.user, session: data.session, error: null };
    } catch (error: any) {
      console.error('❌ Unexpected Apple sign in error:', error);
      return { 
        user: null, 
        session: null, 
        error: new AuthError(error.message || 'Failed to sign in with Apple', error.status || 500)
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      console.log('👋 Signing out');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        return { error };
      }

      // Clear any local storage
      await AsyncStorage.removeItem('supabase.auth.token');
      
      console.log('✅ Signed out successfully');
      return { error: null };
    } catch (error: any) {
      console.error('❌ Unexpected sign out error:', error);
      return { 
        error: new AuthError(error.message || 'Failed to sign out', error.status || 500)
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      console.log('📧 Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'rostrdating://reset-password',
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { error };
      }

      console.log('✅ Password reset email sent');
      return { error: null };
    } catch (error: any) {
      console.error('❌ Unexpected password reset error:', error);
      return { 
        error: new AuthError(error.message || 'Failed to send reset email', error.status || 500)
      };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('❌ Failed to get session:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('❌ Failed to get user:', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      callback(event, session);
    });
  }

  /**
   * Update user profile after auth
   */
  async updateUserProfile(updates: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  }): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        console.error('❌ Profile update error:', error);
        return { error };
      }

      console.log('✅ Profile updated successfully');
      return { error: null };
    } catch (error: any) {
      console.error('❌ Unexpected profile update error:', error);
      return { 
        error: new AuthError(error.message || 'Failed to update profile', error.status || 500)
      };
    }
  }

  /**
   * Check if email is already registered
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      // This is a workaround since Supabase doesn't have a direct API for this
      // We try to sign in with a wrong password to check if email exists
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy_password_to_check_email_12345',
      });

      // If error message contains "Invalid login credentials", email exists
      if (error && error.message.includes('Invalid login credentials')) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking email:', error);
      return false;
    }
  }
}

export const simpleAuth = new SimpleAuthService();