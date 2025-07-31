import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAuth } from '@/hooks/useSafeAuth';

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const auth = useSafeAuth();
  const isAuthenticated = auth?.isAuthenticated || false;
  const isLoading = auth?.isLoading || false;
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    console.log('🔐 AuthenticatedApp:', { isAuthenticated, isLoading, segments });
    
    if (isLoading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to onboarding
      console.log('🔀 Redirecting to onboarding (not authenticated)');
      router.replace('/(auth)/onboarding-welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but still in auth screens, redirect to main app
      console.log('🔀 Redirecting to main app (authenticated)');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}