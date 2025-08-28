import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Alert, ActivityIndicator } from 'react-native';
import { joinCircleByInvite, getCircleInviteInfo } from '@/services/supabase/circleJoining';
import { useSafeAuth } from '@/hooks/useSafeAuth';

interface InviteParams {
  circle?: string;
  invited_by?: string;
  ref?: string;
  username?: string;
}

export function useDeepLinks() {
  const router = useRouter();
  const auth = useSafeAuth();
  const processedUrls = useRef(new Set<string>());

  const handleCircleInvite = async (circleId: string, invitedByName?: string) => {
    if (!auth?.user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to join circles.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/') }
        ]
      );
      return;
    }

    try {
      // Get invite information first
      const inviteInfo = await getCircleInviteInfo(circleId, auth.user.id);
      
      if (!inviteInfo) {
        Alert.alert('Invalid Invite', 'This circle invitation is no longer valid.');
        return;
      }

      if (inviteInfo.is_already_member) {
        Alert.alert(
          'Already a Member',
          `You're already a member of "${inviteInfo.circle_name}". Would you like to view it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View Circle', onPress: () => router.push(`/circles/${circleId}`) }
          ]
        );
        return;
      }

      if (inviteInfo.is_expired) {
        Alert.alert('Expired Invite', 'This circle invitation has expired.');
        return;
      }

      const inviterName = invitedByName || 'Someone';
      
      Alert.alert(
        'Circle Invitation',
        `${inviterName} invited you to join "${inviteInfo.circle_name}"!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { 
            text: 'Join Circle', 
            onPress: async () => {
              // Show loading state and join circle
              const result = await joinCircleByInvite(circleId, auth.user.id, inviterName);
              
              if (result.success) {
                Alert.alert(
                  'Welcome!',
                  `You've successfully joined "${result.circle?.name}"!`,
                  [
                    { 
                      text: 'View Circle', 
                      onPress: () => router.push(`/circles/${circleId}`)
                    }
                  ]
                );
              } else {
                Alert.alert('Join Failed', result.error || 'Failed to join circle. Please try again.');
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error handling circle invite:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleInviteLink = async (params: InviteParams) => {
    try {
      if (params.circle) {
        // Handle circle invitation
        const invitedBy = params.invited_by ? decodeURIComponent(params.invited_by) : undefined;
        await handleCircleInvite(params.circle, invitedBy);
      } else if (params.username) {
        // Handle profile deep link
        console.log('Opening profile:', params.username);
        router.push(`/profile/${params.username}`);
      } else if (params.ref) {
        // Handle general app referral
        const referrerName = params.invited_by ? decodeURIComponent(params.invited_by) : 'a friend';
        
        Alert.alert(
          'Welcome to RostrDating!',
          `${referrerName} invited you to join RostrDating! 🎉`,
          [
            { text: 'Get Started', onPress: () => router.push('/(tabs)/') },
          ]
        );
      }
    } catch (error) {
      console.error('Error handling invite link:', error);
    }
  };

  const processDeepLink = async (url: string) => {
    try {
      // Prevent processing the same URL multiple times
      if (processedUrls.current.has(url)) {
        console.log('🔄 Deep link already processed, skipping:', url);
        return;
      }
      processedUrls.current.add(url);

      console.log('🔗 Processing deep link:', url);

      // Validate URL format
      if (!url || typeof url !== 'string') {
        console.error('❌ Invalid URL format:', url);
        return;
      }

      // Handle both custom scheme and universal links
      if (url.startsWith('rostrdating://') || url.startsWith('rostr://')) {
        console.log('📱 Processing custom scheme link');
        const parsedUrl = Linking.parse(url);
        const { hostname, queryParams } = parsedUrl;
        
        console.log('🔍 Parsed URL:', { hostname, queryParams, path: parsedUrl.path });
        
        if (hostname === 'invite') {
          console.log('🎉 Processing circle invite via custom scheme');
          await handleInviteLink(queryParams as InviteParams);
        } else if (hostname === 'profile') {
          const username = parsedUrl.path?.replace('/', '');
          if (username) {
            console.log('👤 Processing profile link via custom scheme:', username);
            await handleInviteLink({ username });
          } else {
            console.warn('⚠️ Profile link missing username');
          }
        } else {
          console.warn('⚠️ Unknown custom scheme hostname:', hostname);
        }
      } else if (url.startsWith('https://rostrdating.app') || url.startsWith('https://www.rostrdating.app')) {
        console.log('🌐 Processing universal link');
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const searchParams = new URLSearchParams(urlObj.search);
        
        console.log('🔍 Parsed universal link:', { 
          pathname: urlObj.pathname, 
          pathParts, 
          searchParams: Object.fromEntries(searchParams.entries()) 
        });
        
        if (pathParts[0] === 'invite' && pathParts[1]) {
          // Handle invite links like https://rostrdating.app/invite/circle-id
          console.log('🎉 Processing circle invite via universal link:', pathParts[1]);
          const invitedBy = searchParams.get('invited_by');
          await handleInviteLink({ 
            circle: pathParts[1],
            invited_by: invitedBy || undefined
          });
        } else if (pathParts[0]?.startsWith('@')) {
          // Handle profile links like rostrdating.app/@username
          const username = pathParts[0].substring(1);
          console.log('👤 Processing profile link via universal link (@username):', username);
          await handleInviteLink({ username });
        } else if (pathParts[0] === 'profile' && pathParts[1]) {
          // Handle profile links like rostrdating.app/profile/username
          console.log('👤 Processing profile link via universal link (profile/username):', pathParts[1]);
          await handleInviteLink({ username: pathParts[1] });
        } else {
          console.warn('⚠️ Unknown universal link path:', pathParts);
        }
      } else {
        console.warn('⚠️ Unsupported deep link format:', url);
      }
    } catch (error) {
      console.error('❌ Error processing deep link:', error);
      
      // Show user-friendly error for critical failures
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          Alert.alert(
            'Connection Error',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Link Error',
            'There was a problem opening this link. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
      
      // Remove from processed URLs so it can be retried
      processedUrls.current.delete(url);
    }
  };

  useEffect(() => {
    // Handle the case where the app is opened via a deep link
    const handleInitialUrl = async () => {
      try {
        console.log('🚀 Checking for initial deep link...');
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🔗 Found initial deep link:', initialUrl);
          // Add a small delay to ensure the app is fully loaded
          setTimeout(() => {
            processDeepLink(initialUrl);
          }, 1000);
        } else {
          console.log('ℹ️ No initial deep link found');
        }
      } catch (error) {
        console.error('❌ Error handling initial URL:', error);
      }
    };

    // Handle deep links when the app is already running
    const handleUrlChange = (event: { url: string }) => {
      console.log('🔄 Received deep link while app running:', event.url);
      processDeepLink(event.url);
    };

    // Set up listeners
    handleInitialUrl();
    const subscription = Linking.addEventListener('url', handleUrlChange);

    console.log('✅ Deep link listeners initialized');

    return () => {
      console.log('🧹 Cleaning up deep link listeners');
      subscription?.remove();
      // Clear processed URLs on unmount
      processedUrls.current.clear();
    };
  }, [router, auth]);

  return {
    processDeepLink,
  };
}