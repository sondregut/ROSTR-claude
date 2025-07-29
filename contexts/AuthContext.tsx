import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService } from '@/services/supabase/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string, name: string) => Promise<void>;
  devSkipAuth: () => void; // For development only
  updateProfileComplete: (complete: boolean) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false); // For development bypass
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const isAuthenticated = (!!user && !!session) || devMode;

  useEffect(() => {
    // Get initial session
    AuthService.getSession().then(async (session) => {
      // In development, you can uncomment this line to always start fresh:
      await supabase.auth.signOut();
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if profile is complete
      if (session?.user) {
        await checkProfileComplete(session.user.id);
      }
      
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          // Clear any cached user data
          setUser(null);
          setSession(null);
          setIsProfileComplete(false);
        } else if (session?.user) {
          // Check profile completion for signed in users
          await checkProfileComplete(session.user.id);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileComplete = async (userId: string) => {
    try {
      const { UserService } = await import('@/services/supabase/users');
      const profile = await UserService.getProfile(userId);
      
      // Check if profile has required fields: name, date_of_birth, gender
      const isComplete = !!(
        profile?.name && 
        profile?.date_of_birth && 
        profile?.gender
      );
      
      setIsProfileComplete(isComplete);
    } catch (error) {
      console.error('Failed to check profile completion:', error);
      setIsProfileComplete(false);
    }
  };

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { user, session } = await AuthService.signIn({ email, password });
      setUser(user);
      setSession(session);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { user, session } = await AuthService.signUp({ 
        email, 
        password, 
        name
      });
      
      // Create user profile in the users table
      if (user) {
        try {
          const { UserService } = await import('@/services/supabase/users');
          await UserService.createProfile({
            id: user.id,
            email: user.email || email,
            name: name,
            username: '', // Will be set during profile setup
            bio: '',
            location: '',
            occupation: '',
            age: 0,
            image_uri: '',
            instagram_username: '',
            total_dates: 0,
            active_connections: 0,
            avg_rating: 0,
            gender: '',
            date_of_birth: '',
            phone: user.phone || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } catch (profileError: any) {
          // Check if it's a duplicate key error (profile already exists from trigger)
          if (profileError?.code === '23505' || profileError?.message?.includes('duplicate key')) {
            console.log('User profile already exists (likely created by database trigger)');
            // Try to update the existing profile with the phone number
            try {
              await UserService.updateProfile(user.id, {
                phone: user.phone || '',
                name: name
              });
            } catch (updateError) {
              console.error('Failed to update existing profile:', updateError);
            }
          } else {
            console.error('Failed to create user profile:', profileError);
          }
          // Don't throw here - user is authenticated, they can complete profile later
        }
      }
      
      setUser(user);
      setSession(session);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign up';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setIsProfileComplete(false);
      setDevMode(false);
      
      // Then sign out from Supabase
      await AuthService.signOut();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign out';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await AuthService.resetPassword(email);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send password reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const sendPhoneOtp = async (phone: string) => {
    try {
      setError(null);
      await AuthService.sendPhoneOtp(phone);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send verification code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verifyPhoneOtp = async (phone: string, otp: string, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📱 AuthContext: Starting phone OTP verification');
      const { user, session } = await AuthService.verifyPhoneOtp(phone, otp, name);
      console.log('✅ AuthContext: OTP verification completed', { user: user?.id, session: !!session });
      
      // Create user profile in the users table
      if (user) {
        try {
          const { UserService } = await import('@/services/supabase/users');
          const existingProfile = await UserService.getProfile(user.id);
          
          if (!existingProfile) {
            await UserService.createProfile({
              id: user.id,
              email: user.email || '',
              name: name,
              username: '', // Will be set during profile setup
              bio: '',
              location: '',
              occupation: '',
              age: 0,
              image_uri: '',
              instagram_username: '',
              total_dates: 0,
              active_connections: 0,
              avg_rating: 0,
              gender: '',
              date_of_birth: '',
              phone: phone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } catch (profileError: any) {
          // Check if it's a duplicate key error (profile already exists from trigger)
          if (profileError?.code === '23505' || profileError?.message?.includes('duplicate key')) {
            console.log('User profile already exists (likely created by database trigger)');
            // Try to update the existing profile with the phone number
            try {
              await UserService.updateProfile(user.id, {
                phone: user.phone || '',
                name: name
              });
            } catch (updateError) {
              console.error('Failed to update existing profile:', updateError);
            }
          } else {
            console.error('Failed to create user profile:', profileError);
          }
          // Don't throw here - user is authenticated, they can complete profile later
        }
      }
      
      setUser(user);
      setSession(session);
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid verification code';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const devSkipAuth = () => {
    // For development only - bypass authentication
    if (__DEV__) {
      setDevMode(true);
      setIsLoading(false);
      console.log('🚀 Development mode: Authentication bypassed');
    }
  };

  const updateProfileComplete = (complete: boolean) => {
    setIsProfileComplete(complete);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated,
        isProfileComplete,
        signIn,
        signUp,
        signOut,
        resetPassword,
        sendPhoneOtp,
        verifyPhoneOtp,
        devSkipAuth,
        updateProfileComplete,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}