import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function AuthLayout() {
  // Force light mode for all onboarding screens
  const colors = Colors.light;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Disabled to prevent gesture conflicts
          animation: 'fade', // Use simple fade animation
        }}
      >
        <Stack.Screen name="onboarding-welcome" />
        <Stack.Screen name="welcome-new" />
        <Stack.Screen name="email-signup" />
        <Stack.Screen name="email-signin" />
        
        {/* Keep old screens temporarily for backwards compatibility */}
        <Stack.Screen name="welcome" />
        <Stack.Screen name="create-account" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="email-setup" />
        <Stack.Screen name="apple-connect" />
        <Stack.Screen name="name-setup" />
        <Stack.Screen name="birthday-setup" />
        <Stack.Screen name="gender-setup" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="phone-auth" />
        <Stack.Screen name="verify-phone" />
        <Stack.Screen name="trouble-signin" />
        <Stack.Screen name="friend-invite" />
      </Stack>
    </View>
  );
}