import { Linking, Alert } from 'react-native';

export interface InstagramProfile {
  username: string;
  isValid: boolean;
}

export const validateInstagramUsername = (username: string): boolean => {
  if (!username) return false;
  
  // Remove @ symbol if present
  const cleanUsername = username.replace(/^@/, '');
  
  // Instagram username rules:
  // - 1-30 characters
  // - Only letters, numbers, periods, and underscores
  // - Cannot start or end with a period
  // - Cannot have consecutive periods
  const instagramRegex = /^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;
  
  return instagramRegex.test(cleanUsername) && !cleanUsername.startsWith('.');
};

export const formatInstagramUsername = (username: string): string => {
  if (!username) return '';
  
  // Remove @ symbol if present and clean the username
  const cleanUsername = username.replace(/^@/, '').trim();
  
  return cleanUsername;
};

export const getInstagramProfileUrl = (username: string): string => {
  const cleanUsername = formatInstagramUsername(username);
  return `https://instagram.com/${cleanUsername}`;
};

export const getInstagramDeepLink = (username: string): string => {
  const cleanUsername = formatInstagramUsername(username);
  return `instagram://user?username=${cleanUsername}`;
};

export const openInstagramProfile = async (username: string): Promise<void> => {
  if (!username || !validateInstagramUsername(username)) {
    Alert.alert('Invalid Username', 'Please enter a valid Instagram username.');
    return;
  }

  const cleanUsername = formatInstagramUsername(username);
  const deepLink = getInstagramDeepLink(cleanUsername);
  const webUrl = getInstagramProfileUrl(cleanUsername);

  try {
    // Try to open Instagram app first
    const canOpenDeepLink = await Linking.canOpenURL(deepLink);
    
    if (canOpenDeepLink) {
      await Linking.openURL(deepLink);
    } else {
      // Fall back to web browser
      const canOpenWeb = await Linking.canOpenURL(webUrl);
      
      if (canOpenWeb) {
        await Linking.openURL(webUrl);
      } else {
        Alert.alert(
          'Cannot Open Instagram', 
          'Unable to open Instagram. Please check that you have Instagram installed or a web browser available.'
        );
      }
    }
  } catch (error) {
    console.error('Error opening Instagram profile:', error);
    
    // Final fallback to web URL
    try {
      await Linking.openURL(webUrl);
    } catch (webError) {
      Alert.alert(
        'Error', 
        'Unable to open Instagram profile. Please try again later.'
      );
    }
  }
};

export const getDisplayUsername = (username: string): string => {
  const cleanUsername = formatInstagramUsername(username);
  return cleanUsername ? `@${cleanUsername}` : '';
};