import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Alert, ActivityIndicator } from 'react-native';
import { joinCircleByInvite, getCircleInviteInfo } from '@/services/supabase/circleJoining';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { FriendRequestService } from '@/services/FriendRequestService';
import { UserService } from '@/services/supabase/users';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger';
import { useReferral } from '@/contexts/ReferralContext';

interface InviteParams {
  circle?: string;
  invited_by?: string;
  ref?: string;
  username?: string;
  phone?: string;
}

export function useDeepLinks() {
  const router = useRouter();
  const auth = useSafeAuth();
  const { setReferralData } = useReferral();
  const processedUrls = useRef(new Set<string>());

  const handleCircleInvite = async (circleId: string, invitedByName?: string) => {
    if (!auth?.user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to join circles.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)') }
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
              const result = await joinCircleByInvite(circleId, auth.user!.id, inviterName);
              
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

  const handleProfileInvite = async (username: string, referrerId: string) => {
    try {
      // Get the profile user by username
      const profileUser = await UserService.getUserByUsername(username);
      
      if (!profileUser) {
        Alert.alert('User Not Found', 'This user profile could not be found.');
        return;
      }

      // Navigate to profile first
      router.push(`/profile/${username}`);

      // Auto-send friend request from the referrer
      logger.debug('🤝 Auto-sending friend request from referrer:', referrerId, 'to profile user:', profileUser.id);
      
      const success = await FriendRequestService.sendFriendRequest(profileUser.id);
      
      if (success) {
        // Show success message with some delay to ensure profile screen has loaded
        setTimeout(() => {
          Alert.alert(
            'Connected!',
            `You're now connected with ${profileUser.name}! 🎉`,
            [{ text: 'Great!' }]
          );
        }, 1000);
      } else {
        logger.debug('Friend request failed or already exists');
      }
    } catch (error) {
      console.error('Error handling profile invite:', error);
      // Still navigate to profile even if friend request fails
      router.push(`/profile/${username}`);
    }
  };

  const handlePhoneBasedInvite = async (referrerId: string, phoneHash: string) => {
    try {
      logger.debug('📞 Processing phone-based invite from:', referrerId, 'phone:', phoneHash);
      
      // Get the referrer user info
      const { data: referrer } = await supabase
        .from('users')
        .select('name, username')
        .eq('id', referrerId)
        .single();

      const referrerName = referrer?.name || 'A friend';
      
      // Store referral data in context
      await setReferralData({
        ref: referrerId,
        phone: phoneHash,
        invited_by: referrerName,
      });
      
      if (auth?.user) {
        // User is already authenticated, show friend invite screen directly
        router.push({
          pathname: '/(auth)/friend-invite',
          params: {
            ref: referrerId,
            phone: phoneHash,
            invited_by: referrerName,
          }
        });
      } else {
        // User needs to authenticate, context will handle showing invite after auth
        logger.debug('🔐 User not authenticated, referral data stored for after auth');
      }
    } catch (error) {
      console.error('Error handling phone-based invite:', error);
      // Fallback to regular welcome
      Alert.alert(
        'Welcome to RostrDating!',
        'A friend invited you to join! 🎉',
        [{ text: 'Get Started', onPress: () => router.push('/(tabs)') }]
      );
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
        console.log('Opening profile:', params.username, 'with referrer:', params.ref);
        
        if (params.ref) {
          // This is a profile link with a referrer - auto-send friend request
          await handleProfileInvite(params.username, params.ref);
        } else {
          // Regular profile link without referrer
          router.push(`/profile/${params.username}`);
        }
      } else if (params.ref && params.phone) {
        // Handle phone-based referral invite
        await handlePhoneBasedInvite(params.ref, params.phone);
      } else if (params.ref) {
        // Handle general app referral
        const referrerName = params.invited_by ? decodeURIComponent(params.invited_by) : 'a friend';
        
        // Store referral data in context for general referrals too
        await setReferralData({
          ref: params.ref,
          invited_by: referrerName,
          circle: params.circle,
        });
        
        Alert.alert(
          'Welcome to RostrDating!',
          `${referrerName} invited you to join RostrDating! 🎉`,
          [
            { text: 'Get Started', onPress: () => router.push('/(tabs)') },
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
      } else if (url.startsWith('https://rostrdating.com') || url.startsWith('https://www.rostrdating.com')) {
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
          // Handle invite links like https://rostrdating.com/invite/circle-id
          console.log('🎉 Processing circle invite via universal link:', pathParts[1]);
          const invitedBy = searchParams.get('invited_by');
          await handleInviteLink({ 
            circle: pathParts[1],
            invited_by: invitedBy || undefined
          });
        } else if (pathParts[0]?.startsWith('@')) {
          // Handle profile links like rostrdating.com/@username
          const username = pathParts[0].substring(1);
          const referrerId = searchParams.get('ref');
          console.log('👤 Processing profile link via universal link (@username):', username, 'referrer:', referrerId);
          await handleInviteLink({ 
            username,
            ref: referrerId || undefined 
          });
        } else if (pathParts[0] === 'profile' && pathParts[1]) {
          // Handle profile links like rostrdating.com/profile/username
          const referrerId = searchParams.get('ref');
          console.log('👤 Processing profile link via universal link (profile/username):', pathParts[1], 'referrer:', referrerId);
          await handleInviteLink({ 
            username: pathParts[1],
            ref: referrerId || undefined 
          });
        } else if (pathParts.length === 0) {
          // Handle root-level query parameter URLs like https://rostrdating.com?ref=123&phone=456
          console.log('🔗 Processing root-level universal link with query params');
          const params = {
            ref: searchParams.get('ref') || undefined,
            phone: searchParams.get('phone') || undefined,
            invited_by: searchParams.get('invited_by') || undefined,
            circle: searchParams.get('circle') || undefined
          };
          
          console.log('📋 Extracted params:', params);
          
          // Only process if we have a ref parameter (indicates it's a referral link)
          if (params.ref) {
            await handleInviteLink(params);
          } else {
            console.log('ℹ️ Root-level URL with no referral parameters - treating as normal web visit');
          }
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
  }, []);

  return {
    processDeepLink,
  };
}