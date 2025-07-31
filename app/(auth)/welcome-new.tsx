import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { simpleAuth } from '@/services/supabase/simpleAuth';
import { debugAppleAuth } from '@/utils/debugAppleAuth';
import { useOnboardingState } from '@/hooks/useOnboardingState';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { hasSeenWelcome, isLoading: onboardingLoading } = useOnboardingState();

  // Check if user needs to see onboarding
  useEffect(() => {
    if (!onboardingLoading && !hasSeenWelcome) {
      router.replace('/(auth)/onboarding-welcome');
    }
  }, [hasSeenWelcome, onboardingLoading]);

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Check if Apple Sign In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('🍎 Apple Sign In available:', isAvailable);
      
      if (!isAvailable) {
        Alert.alert('Not Available', 'Apple Sign In is not available on this device.');
        return;
      }
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 Apple credential received:', credential);
      console.log('🔑 Identity token:', credential.identityToken ? 'Present' : 'Missing');
      console.log('👤 User ID:', credential.user);

      // Sign in with Supabase using the Apple credential
      const result = await simpleAuth.signInWithApple({
        identityToken: credential.identityToken!,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      });

      if (result.error) {
        throw result.error;
      }

      if (result.user) {
        console.log('Apple Sign In successful:', result.user.id);
        // Navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Apple Sign In error:', error);
      console.error('Error code:', error.code);
      console.error('Error domain:', error.domain);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.code === 'ERR_CANCELED') {
        // User cancelled, do nothing
        return;
      }
      
      Alert.alert(
        'Sign In Failed',
        'Unable to sign in with Apple. Please try email sign in.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    router.push('/(auth)/email-signup');
  };

  const handleSignIn = () => {
    router.push('/(auth)/email-signin');
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      <View style={styles.container}>
        {/* Gradient background */}
        <LinearGradient 
          colors={['#FE5268', '#FE6B73']} 
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.content}>
            {/* Logo and App Name */}
            <View style={styles.brandingContainer}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('@/assets/images/rostr-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>rostr</Text>
              <Text style={styles.tagline}>Find your perfect match</Text>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {Platform.OS === 'ios' && (
                  <Pressable
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                    disabled={isLoading}
                  >
                    <Ionicons name="logo-apple" size={20} color="white" />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </Pressable>
                )}
                
                <Pressable
                  style={styles.emailButton}
                  onPress={handleEmailSignUp}
                  disabled={isLoading}
                >
                  <Ionicons name="mail-outline" size={20} color="#FE5268" />
                  <Text style={styles.emailButtonText}>Continue with Email</Text>
                </Pressable>
              </View>

              {/* Sign in link */}
              <Pressable
                onPress={handleSignIn}
                style={styles.signInButton}
                disabled={isLoading}
              >
                <Text style={styles.signInText}>Already have an account? Sign in</Text>
              </Pressable>

              {/* Legal Text */}
              <View style={styles.legalContainer}>
                <Text style={styles.legalText}>
                  By continuing, you agree to our{' '}
                  <Text style={styles.legalLink}>Terms</Text> and{' '}
                  <Text style={styles.legalLink}>Privacy Policy</Text>
                </Text>
              </View>
              
              {/* Debug button - REMOVE BEFORE PRODUCTION */}
              {__DEV__ && (
                <>
                  <Pressable
                    onPress={debugAppleAuth}
                    style={{ marginTop: 20, padding: 10 }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center' }}>Debug Apple Auth</Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      const { resetOnboardingForTesting } = await import('@/utils/resetOnboarding');
                      await resetOnboardingForTesting();
                      router.replace('/(auth)/onboarding-welcome');
                    }}
                    style={{ marginTop: 10, padding: 15, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>🎯 Show Onboarding (Dev)</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'space-between',
  },
  brandingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 56,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -1,
    textTransform: 'lowercase',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  bottomSection: {
    paddingBottom: 20,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  appleButton: {
    backgroundColor: 'black',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  appleButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emailButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  emailButtonText: {
    color: '#FE5268',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signInButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signInText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  legalContainer: {
    marginTop: 30,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});