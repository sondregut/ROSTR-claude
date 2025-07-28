import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === '(auth)';
    const inProfileSetup = segments[1] === 'profile-setup';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup && !inProfileSetup) {
      // User is authenticated but still in auth screens (excluding profile-setup)
      if (!isProfileComplete) {
        // If profile is not complete, redirect to profile setup
        router.replace('/(auth)/profile-setup');
      } else {
        // If profile is complete, redirect to main app
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && isProfileComplete && inProfileSetup) {
      // User has completed profile but is still on profile-setup, redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isProfileComplete, segments, router]);

  return <>{children}</>;
}