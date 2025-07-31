import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { OptimizedImage } from './OptimizedImage';
import { useColorScheme } from '@/hooks/useColorScheme';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Avatar({ 
  uri, 
  name, 
  size = 40, 
  backgroundColor,
  textColor = 'white',
  style
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const getInitials = (fullName: string | null | undefined) => {
    if (!fullName) return '?';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  // Generate consistent color based on name
  const getBackgroundColor = (fullName: string | null | undefined): string => {
    if (backgroundColor) return backgroundColor;
    if (!fullName) return colors.primary;
    
    // Simple hash function for consistent colors
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const avatarColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    ];
    
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  const finalBackgroundColor = getBackgroundColor(name);
  
  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: (!uri || imageError) ? finalBackgroundColor : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: size / 2,
    },
    initials: {
      fontSize: size * 0.4,
      fontWeight: '600',
      color: textColor,
    },
  });

  const showPlaceholder = !uri || imageError;

  return (
    <View style={[styles.container, style]}>
      {!showPlaceholder ? (
        <OptimizedImage
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Text style={styles.initials}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}