import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { AuthService } from '@/services/supabase/auth';

export default function AppleConnectScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  React.useEffect(() => {
    // Check if Apple authentication is available
    AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
  }, []);

  const handleSkip = () => {
    // Skip Apple auth and go to name setup
    router.push('/(auth)/name-setup');
  };

  const handleAppleSignIn = async () => {
    if (!isAppleAvailable) {
      Alert.alert('Not Available', 'Apple Sign In is not available on this device');
      return;
    }

    try {
      setIsLoading(true);
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Link Apple account with existing user
      await AuthService.linkAppleAccount({
        identityToken: credential.identityToken!,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      });

      // Navigate to name setup
      router.push('/(auth)/name-setup');
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow
        return;
      }
      
      console.error('Apple Sign In error:', error);
      Alert.alert(
        'Sign In Failed',
        'Unable to connect with Apple. You can skip this step and continue.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.backButton} />
            <Pressable
              onPress={handleSkip}
              style={styles.skipButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.skipText}>SKIP</Text>
            </Pressable>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>Would you like to connect your account?</Text>
            <Text style={styles.subtitle}>
              Linking your account makes it easier to sign in.
            </Text>

            {/* Apple Sign In Button */}
            {isAppleAvailable ? (
              <Pressable
                style={[styles.appleButton, isLoading && styles.buttonDisabled]}
                onPress={handleAppleSignIn}
                disabled={isLoading}
              >
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={styles.appleButtonText}>
                  {isLoading ? 'CONNECTING...' : 'CONTINUE WITH APPLE'}
                </Text>
              </Pressable>
            ) : Platform.OS === 'ios' ? (
              <View style={styles.notAvailableContainer}>
                <Text style={styles.notAvailableText}>
                  Apple Sign In is not available on this device
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    maxWidth: 320,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.5,
  },
  notAvailableContainer: {
    padding: 20,
    alignItems: 'center',
  },
  notAvailableText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});