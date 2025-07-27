import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Custom background for Android/Web that respects our theme
export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
