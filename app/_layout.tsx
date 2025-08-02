// Import URL polyfill first - CRITICAL for React Native
import 'react-native-url-polyfill/auto';

// Verify URL polyfill is working
if (typeof URL === 'undefined' && __DEV__) {
  console.error('❌ URL polyfill failed to load!');
}


import React from 'react';
import { View, Text } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { DateProvider } from '@/contexts/DateContext';
import { RosterProvider } from '@/contexts/RosterContext';
import { CircleProvider } from '@/contexts/CircleContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthenticatedApp } from '@/components/AuthenticatedApp';
import { useDeepLinks } from '@/hooks/useDeepLinks';
import { verifyEnvironmentVariables } from '@/utils/verifyEnv';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initSentry } from '@/services/sentry';
import { memoryMonitor } from '@/utils/memoryMonitor';


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
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="circles/[id]" 
            options={{ 
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }} 
          />
          <Stack.Screen 
            name="circles/[id]/settings" 
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
            name="person/[personName]" 
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
            }} 
          />
          <Stack.Screen 
            name="notifications" 
            options={{ 
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
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

  // Initialize services on app start with non-blocking operations
  React.useEffect(() => {
    // Defer initialization to prevent blocking main thread
    const initTimeout = setTimeout(() => {
      try {
        // Verify environment variables
        verifyEnvironmentVariables();
        
        // Initialize Sentry for error tracking (only if configured)
        try {
          initSentry();
        } catch (sentryError) {
          if (__DEV__) {
            console.log('Sentry initialization skipped:', sentryError.message);
          }
        }
        
        // Start memory monitoring after a delay
        setTimeout(() => {
          memoryMonitor.startMonitoring();
        }, 1000);
      } catch (error) {
        if (__DEV__) {
          console.error('❌ App initialization failed:', error);
        }
      }
    }, 100); // Small delay to allow UI to render first
    
    // Cleanup on unmount
    return () => {
      clearTimeout(initTimeout);
      memoryMonitor.stopMonitoring();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppThemeProvider>
          <SimpleAuthProvider>
            <UserProvider>
              <DateProvider>
                <RosterProvider>
                  <CircleProvider>
                    <NotificationProvider>
                      <RootLayoutNav />
                    </NotificationProvider>
                  </CircleProvider>
                </RosterProvider>
              </DateProvider>
            </UserProvider>
          </SimpleAuthProvider>
        </AppThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
