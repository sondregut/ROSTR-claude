import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignInData {
  email?: string;
  phone?: string;
  password: string;
}

export class AuthService {
  /**
   * Detect if input is email or phone number
   */
  static isEmail(input: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }

  /**
   * Detect if input is phone number
   */
  static isPhone(input: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(input.replace(/\s+/g, ''));
  }

  /**
   * Sign up a new user
   */
  static async signUp({ email, password, name, phone }: SignUpData) {
    try {
      const authData: any = {
        password,
        options: {
          data: {
            name,
          },
        },
      };

      // Determine if we're using email or phone
      if (this.isEmail(email)) {
        authData.email = email;
      } else if (this.isPhone(email)) {
        // If email field contains a phone number, use it as phone
        authData.phone = email.replace(/\s+/g, '');
      } else {
        // Default to email if format is unclear
        authData.email = email;
      }

      const { data, error } = await supabase.auth.signUp(authData);

      if (error) {
        throw error;
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign in existing user
   */
  static async signIn({ email, phone, password }: SignInData) {
    try {
      const authData: any = { password };

      // Use email or phone based on what was provided
      if (email) {
        if (this.isEmail(email)) {
          authData.email = email;
        } else if (this.isPhone(email)) {
          authData.phone = email.replace(/\s+/g, '');
        } else {
          authData.email = email; // Default to email
        }
      } else if (phone) {
        authData.phone = phone.replace(/\s+/g, '');
      } else {
        throw new Error('Email or phone number is required');
      }

      const { data, error } = await supabase.auth.signInWithPassword(authData);

      if (error) {
        throw error;
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      // Force clear the session to ensure clean sign out
      await supabase.auth.getSession();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw error;
      }
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw error;
      }
      Alert.alert(
        'Password Reset',
        'Check your email for password reset instructions.'
      );
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Send OTP to phone number
   */
  static async sendPhoneOtp(phone: string) {
    const cleanPhone = phone.replace(/\s+/g, '');
    console.log('📱 Attempting to send OTP to:', cleanPhone);
    
    // Check if Supabase client is properly initialized
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    try {
      console.log('🔄 Sending OTP request...');
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: cleanPhone,
        options: {
          shouldCreateUser: true,
          channel: 'sms',
        }
      });

      if (error) {
        console.error('❌ Supabase error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        // Handle specific errors
        if (error.message?.includes('Phone provider is not configured')) {
          throw new Error('Phone authentication is not configured. Please use email signup instead.');
        } else if (error.message?.includes('Invalid phone')) {
          throw new Error('Invalid phone number format. Please include country code (e.g., +1 for US).');
        } else if (error.status === 429) {
          throw new Error('Too many attempts. Please wait a moment before trying again.');
        } else if (error.message?.includes('Network request failed') || error.message?.includes('fetch failed')) {
          console.error('🌐 Network request failed - debugging info:');
          console.error('URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
          console.error('Error full:', error);
          
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (error.message?.includes('No API key found')) {
          throw new Error('Configuration error. Please contact support.');
        }
        
        throw error;
      }

      console.log('✅ SMS sent successfully:', data);
      return data;
    } catch (error: any) {
      console.error('💥 Send phone OTP error:', error);
      throw error;
    }
  }

  /**
   * Verify phone OTP and create user account
   */
  static async verifyPhoneOtp(phone: string, token: string, name: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.replace(/\s+/g, ''),
        token,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      // Update user metadata with name
      if (data.user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            name,
          }
        });

        if (updateError) {
          console.warn('Failed to update user metadata:', updateError);
          // Don't throw here as the main verification succeeded
        }
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Verify phone OTP error:', error);
      throw error;
    }
  }

  /**
   * Listen for auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Link Apple account to existing user
   */
  static async linkAppleAccount(appleCredential: {
    identityToken: string;
    user: string;
    email?: string | null;
    fullName?: {
      givenName?: string | null;
      familyName?: string | null;
    } | null;
  }) {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: appleCredential.identityToken,
        options: {
          data: {
            apple_user_id: appleCredential.user,
            email: appleCredential.email,
            full_name: appleCredential.fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Update user metadata if we got new information
      if (appleCredential.fullName?.givenName && data.user) {
        await supabase.auth.updateUser({
          data: {
            first_name: appleCredential.fullName.givenName,
            last_name: appleCredential.fullName.familyName,
          },
        });
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Link Apple account error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Apple
   */
  static async signInWithApple(appleCredential: {
    identityToken: string;
    user: string;
    email?: string | null;
    fullName?: {
      givenName?: string | null;
      familyName?: string | null;
    } | null;
  }) {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: appleCredential.identityToken,
      });

      if (error) {
        throw error;
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  }
}