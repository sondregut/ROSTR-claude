import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

export function Avatar({ 
  uri, 
  name, 
  size = 40, 
  backgroundColor = Colors.light.primary,
  textColor = 'white' 
}: AvatarProps) {
  
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: uri ? 'transparent' : backgroundColor,
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

  return (
    <View style={styles.container}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.initials}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}