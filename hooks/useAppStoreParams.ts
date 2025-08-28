import { useEffect } from 'react';
import { Linking } from 'react-native';
import { PendingInviteService } from '@/services/pendingInviteService';

/**
 * Hook to check if the app was installed from App Store with circle parameters
 * This handles the case where users tap the App Store link from an invite
 */
export function useAppStoreParams() {
  useEffect(() => {
    const checkForAppStoreParams = async () => {
      try {
        // Get the initial URL when app first launches
        const url = await Linking.getInitialURL();
        
        if (url) {
          console.log('App launched with URL:', url);
          
          // Check if URL contains circle parameters (from App Store redirect)
          const urlObj = new URL(url);
          const circle = urlObj.searchParams.get('circle');
          const inviter = urlObj.searchParams.get('inviter');
          
          if (circle) {
            console.log('Found circle param from App Store:', circle);
            
            // Store as pending invite
            await PendingInviteService.storePendingInvite(
              circle,
              inviter ? decodeURIComponent(inviter) : undefined
            );
          }
        }
        
        // Also check clipboard in case the user copied the link
        // This is a fallback mechanism
        try {
          const { Clipboard } = await import('expo-clipboard');
          const clipboardText = await Clipboard.getStringAsync();
          
          if (clipboardText && clipboardText.includes('rostr://invite')) {
            const match = clipboardText.match(/circle=([^&\s]+)/);
            const inviterMatch = clipboardText.match(/invited_by=([^&\s]+)/);
            
            if (match && match[1]) {
              const hasPending = await PendingInviteService.hasPendingInvite();
              if (!hasPending) {
                console.log('Found circle invite in clipboard:', match[1]);
                await PendingInviteService.storePendingInvite(
                  match[1],
                  inviterMatch ? decodeURIComponent(inviterMatch[1]) : undefined
                );
                
                // Clear clipboard to prevent re-processing
                await Clipboard.setStringAsync('');
              }
            }
          }
        } catch (clipboardError) {
          // Clipboard access might fail, that's okay
          console.log('Could not check clipboard:', clipboardError);
        }
      } catch (error) {
        console.error('Error checking for App Store params:', error);
      }
    };

    // Run check on mount
    checkForAppStoreParams();
  }, []);
}