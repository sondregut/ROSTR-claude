import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useReferral } from '@/contexts/ReferralContext';

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const auth = useSafeAuth();
  const isAuthenticated = auth?.isAuthenticated || false;
  const isLoading = auth?.isLoading || false;
  const segments = useSegments();
  const router = useRouter();
  const { referralData, clearReferralData, hasReferralData } = useReferral();

  React.useEffect(() => {
    console.log('🔐 AuthenticatedApp:', { isAuthenticated, isLoading, segments, hasReferralData });
    
    if (isLoading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === '(auth)';
    const onFriendInviteScreen = segments[0] === '(auth)' && segments[1] === 'friend-invite';

    if (!isAuthenticated && !inAuthGroup) {
      if (hasReferralData) {
        // User has referral data but isn't authenticated, redirect to onboarding
        console.log('🔀 Redirecting to onboarding with referral data');
        router.replace('/(auth)/onboarding-welcome');
      } else {
        // Normal flow - no referral data
        console.log('🔀 Redirecting to onboarding (not authenticated)');
        router.replace('/(auth)/onboarding-welcome');
      }
    } else if (isAuthenticated && inAuthGroup && !onFriendInviteScreen) {
      if (hasReferralData) {
        // User just authenticated and has referral data, show friend invite
        console.log('🎉 User authenticated with referral data, showing friend invite');
        router.replace({
          pathname: '/(auth)/friend-invite',
          params: {
            ref: referralData!.ref,
            phone: referralData!.phone || '',
            invited_by: referralData!.invited_by || '',
          }
        });
      } else {
        // User is authenticated but still in auth screens, redirect to main app
        console.log('🔀 Redirecting to main app (authenticated)');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, segments, router, hasReferralData, referralData]);

  return <>{children}</>;
}