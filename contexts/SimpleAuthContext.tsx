import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import authService from '@/services/supabase/authWithRateLimit';
import { router } from 'expo-router';
import { setSentryUser } from '@/services/sentry';
import { onboardingService } from '@/services/onboardingService';

interface SimpleAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithApple: (authData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!session;

  useEffect(() => {
    // Get initial session
    checkAuth();

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Update Sentry user context
      setSentryUser(session?.user ?? null);
      
      // Handle navigation based on auth state
      if (event === 'SIGNED_IN') {
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/onboarding-welcome');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const session = await authService.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await authService.signInWithEmail(email, password);
      
      if (result.error) {
        throw result.error;
      }
      
      setUser(result.user);
      setSession(result.session);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await authService.signUpWithEmail(email, password, fullName);
      
      if (result.error) {
        throw result.error;
      }
      
      console.log('🔐 SignUp result:', { user: result.user?.id, session: !!result.session });
      setUser(result.user);
      setSession(result.session);
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async (authData: any) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await authService.signInWithApple(authData);
      
      if (result.error) {
        throw result.error;
      }
      
      setUser(result.user);
      setSession(result.session);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Apple');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Reset onboarding state so user sees it again
      await onboardingService.resetOnboarding();
      
      const { error } = await authService.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setSession(null);
    } catch (error: any) {
      setError(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await authService.resetPassword(email);
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signInWithApple,
    signOut,
    resetPassword,
    error,
    clearError,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an SimpleAuthProvider');
  }
  return context;
}