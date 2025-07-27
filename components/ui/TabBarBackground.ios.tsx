import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function BlurTabBarBackground() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}>
      <BlurView
        // Use the appropriate tint for the theme
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        intensity={80}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
