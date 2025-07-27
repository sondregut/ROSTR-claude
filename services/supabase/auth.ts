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
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone.replace(/\s+/g, ''),
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Send phone OTP error:', error);
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
}