// Import URL polyfill first - CRITICAL for React Native
import 'react-native-url-polyfill/auto';

// Verify URL polyfill is working
if (typeof URL === 'undefined') {
  console.error('❌ URL polyfill failed to load!');
} else {
  console.log('✅ URL polyfill loaded successfully');
}

// Network debugging in development
if (__DEV__) {
  require('@/utils/networkDebug');
}

import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { DateProvider } from '@/contexts/DateContext';
import { AuthenticatedApp } from '@/components/AuthenticatedApp';
import { useDeepLinks } from '@/hooks/useDeepLinks';
import { verifyEnvironmentVariables } from '@/utils/verifyEnv';

function RootLayoutNav() {
  const { colorScheme } = useTheme();
  
  // Initialize deep link handling
  useDeepLinks();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthenticatedApp>
        <Stack
          screenOptions={{
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            gestureResponseDistance: 50,
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="roster/[id]" 
            options={{ 
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }} 
          />
          <Stack.Screen 
            name="circles/[id]" 
            options={{ 
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }} 
          />
          <Stack.Screen 
            name="profile/[username]" 
            options={{ 
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{ 
              presentation: 'modal',
              gestureDirection: 'vertical',
              gestureResponseDistance: 100,
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthenticatedApp>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Verify environment variables on app start
  React.useEffect(() => {
    try {
      verifyEnvironmentVariables();
    } catch (error) {
      console.error('❌ Environment verification failed:', error);
    }
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <UserProvider>
          <DateProvider>
            <RootLayoutNav />
          </DateProvider>
        </UserProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
