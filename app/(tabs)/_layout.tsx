import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, useColorScheme as useNativeColorScheme } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  // Try to use theme context, fall back to native color scheme
  let colorScheme: 'light' | 'dark' = 'light';
  try {
    const theme = useTheme();
    colorScheme = theme.colorScheme;
  } catch {
    // Theme context not available, use native
    const nativeScheme = useNativeColorScheme();
    colorScheme = nativeScheme ?? 'light';
  }
  
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        animation: 'shift', // Better animation for gesture support
        tabBarStyle: Platform.select({
          ios: {
            // Force background color on iOS too for consistent theming
            position: 'absolute',
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 90,
            paddingBottom: 10,
          },
          default: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          title: 'Roster',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="update"
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => (
            <View style={styles.addButtonContainer}>
              <IconSymbol size={28} name="plus.circle.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.3.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    transform: [{ scale: 1.2 }],
  },
});
