import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but still in auth screens, redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}