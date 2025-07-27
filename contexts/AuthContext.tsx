import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService } from '@/services/supabase/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string, name: string) => Promise<void>;
  devSkipAuth: () => void; // For development only
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

  const isAuthenticated = (!!user && !!session) || devMode;

  useEffect(() => {
    // Get initial session
    AuthService.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (event === 'SIGNED_OUT') {
          // Clear any cached user data
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      
      await AuthService.signOut();
      setUser(null);
      setSession(null);
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
      
      const { user, session } = await AuthService.verifyPhoneOtp(phone, otp, name);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        resetPassword,
        sendPhoneOtp,
        verifyPhoneOtp,
        devSkipAuth,
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