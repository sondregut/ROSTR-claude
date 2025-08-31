import { Share, Platform } from 'react-native';

export interface Circle {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
}

// App Store URLs
const APP_STORE_URL = 'https://apps.apple.com/us/app/rostrdating/id6749227605';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.sondregut.rostrdating';
const APP_WEBSITE = 'https://rostrdating.com';

export const generateCircleInviteLink = (circleId: string, inviterName?: string): string => {
  const params = new URLSearchParams();
  params.append('circle', circleId);
  if (inviterName) {
    params.append('invited_by', inviterName);
  }
  return `rostrdating://invite?${params.toString()}`;
};

export const generateWebFallbackLink = (circleId: string, inviterName?: string, referrerId?: string): string => {
  const params = new URLSearchParams();
  if (referrerId) {
    params.append('ref', referrerId);
  }
  if (inviterName) {
    params.append('invited_by', inviterName);
  }
  params.append('circle', circleId);
  return `${APP_WEBSITE}?${params.toString()}`;
};

export const generateAppStoreLink = (): string => {
  return Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
};

export const generateCircleInviteMessage = (
  circleName: string, 
  inviterName: string,
  circleId: string,
  referrerId?: string
): string => {
  const deepLink = generateCircleInviteLink(circleId, inviterName);
  const webLink = generateWebFallbackLink(circleId, inviterName, referrerId);
  const storeLink = generateAppStoreLink();
  
  return `Hey! ${inviterName} invited you to join "${circleName}" on RostrDating! 🎉

If you have the app: ${deepLink}

Don't have the app yet? Download it here:
${storeLink}

Or visit: ${webLink}

RostrDating helps you track and share your dating experiences with friends!`;
};

export const shareCircleInvite = async (
  circle: Circle, 
  inviter?: User
): Promise<void> => {
  try {
    const inviterName = inviter?.name || 'Someone';
    const referrerId = inviter?.id;
    const message = generateCircleInviteMessage(circle.name, inviterName, circle.id, referrerId);
    
    const result = await Share.share({
      message: message,
      title: `Invite friends to ${circle.name}`,
    });
    
    if (result.action === Share.sharedAction) {
      console.log('Circle invite shared successfully');
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing circle invite:', error);
    throw error;
  }
};

// Additional utility functions for app sharing
export const shareApp = async (referrer?: User): Promise<void> => {
  try {
    const referrerName = referrer?.name || 'a friend';
    const storeLink = generateAppStoreLink();
    const webLink = `${APP_WEBSITE}${referrer ? `?ref=${referrer.id}&invited_by=${encodeURIComponent(referrer.name)}` : ''}`;
    
    const message = `Hey! ${referrerName} recommended RostrDating - the dating tracker app! 📱💕

Download it here: ${storeLink}

Or visit: ${webLink}

Track your dating journey and share experiences with friends!`;
    
    const result = await Share.share({
      message: message,
      title: 'Share RostrDating',
    });
    
    if (result.action === Share.sharedAction) {
      console.log('App shared successfully');
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing app:', error);
    throw error;
  }
};

// Legacy functions for backward compatibility
export const generateInviteLink = (circleId: string): string => {
  return generateCircleInviteLink(circleId);
};

export const generateInviteMessage = (circleName: string, inviteLink: string): string => {
  return `Hey! You've been invited to join "${circleName}" on RostrDating. Click the link to join: ${inviteLink}`;
};