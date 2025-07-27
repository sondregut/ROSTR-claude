import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

interface InviteParams {
  circle?: string;
  invited_by?: string;
  ref?: string;
}

export function useDeepLinks() {
  const router = useRouter();
  const processedUrls = useRef(new Set<string>());

  const handleInviteLink = async (params: InviteParams) => {
    try {
      if (params.circle) {
        // Handle circle invitation
        const invitedBy = params.invited_by ? decodeURIComponent(params.invited_by) : 'Someone';
        
        Alert.alert(
          'Circle Invitation',
          `${invitedBy} invited you to join a circle! Would you like to view it?`,
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Join Circle', 
              onPress: () => {
                // Navigate to circles tab and potentially show the specific circle
                router.push('/(tabs)/circles');
                // TODO: Add logic to join the circle automatically
                console.log('Joining circle:', params.circle, 'invited by:', invitedBy);
              }
            },
          ]
        );
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
        return;
      }
      processedUrls.current.add(url);

      console.log('Processing deep link:', url);

      const parsedUrl = Linking.parse(url);
      
      if (parsedUrl.scheme === 'rostrdating') {
        const { hostname, queryParams } = parsedUrl;
        
        if (hostname === 'invite') {
          await handleInviteLink(queryParams as InviteParams);
        }
      }
    } catch (error) {
      console.error('Error processing deep link:', error);
    }
  };

  useEffect(() => {
    // Handle the case where the app is opened via a deep link
    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          // Add a small delay to ensure the app is fully loaded
          setTimeout(() => {
            processDeepLink(initialUrl);
          }, 1000);
        }
      } catch (error) {
        console.error('Error handling initial URL:', error);
      }
    };

    // Handle deep links when the app is already running
    const handleUrlChange = (event: { url: string }) => {
      processDeepLink(event.url);
    };

    // Set up listeners
    handleInitialUrl();
    const subscription = Linking.addEventListener('url', handleUrlChange);

    return () => {
      subscription?.remove();
    };
  }, [router]);

  return {
    processDeepLink,
  };
}