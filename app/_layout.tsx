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
import { SafeAnimated } from '@/utils/globalAnimationManager';
import { thermalStateManager } from '@/utils/thermalStateManager';
import { AppState } from 'react-native';


function RootLayoutNav() {
  const { colorScheme } = useTheme();
  
  // Initialize deep link handling
  useDeepLinks();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthenticatedApp>
        <Stack
          screenOptions={{
            gestureEnabled: false, // Disabled to prevent gesture conflicts during transitions
            animation: 'none', // No animation - screens just pop
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="circles/[id]" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="circles/[id]/settings" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="profile/[username]" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="person/[personName]" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{ 
              presentation: 'modal',
            }} 
          />
          <Stack.Screen 
            name="notifications" 
            options={{ 
              headerShown: false,
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
    // Cancel all animations on app state change
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        console.log('[RootLayout] App going to background, cancelling all animations');
        SafeAnimated.cancelAll();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Monitor thermal state changes
    const thermalUnsubscribe = thermalStateManager.addListener((state) => {
      console.log('[RootLayout] Thermal state changed:', state);
      if (state === 'serious' || state === 'critical') {
        // Cancel all animations when device is hot
        SafeAnimated.cancelAll();
      }
    });

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
            console.log('Sentry initialization skipped:', (sentryError as Error).message);
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
      appStateSubscription.remove();
      thermalUnsubscribe();
      SafeAnimated.cancelAll();
      thermalStateManager.cleanup();
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
