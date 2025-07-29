import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/SimpleAuthContext';

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    console.log('🔐 AuthenticatedApp:', { isAuthenticated, isLoading, segments });
    
    if (isLoading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to welcome
      console.log('🔀 Redirecting to welcome (not authenticated)');
      router.replace('/(auth)/welcome-new');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but still in auth screens, redirect to main app
      console.log('🔀 Redirecting to main app (authenticated)');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}