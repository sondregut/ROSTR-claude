import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { devSkipAuth } = useAuth();

  const handleCreateAccount = () => {
    router.push('/(auth)/phone-auth');
  };

  const handleSignIn = () => {
    router.push('/(auth)/signin');
  };

  const handleSkipSignIn = () => {
    // For development: bypass authentication and go directly to main app
    devSkipAuth();
    // The AuthenticatedApp component will handle the navigation automatically
  };

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.secondary]} 
        style={styles.container}
        start={{ x: 0.1, y: 0.2 }}
        end={{ x: 0.9, y: 1.0 }}
      >
        <SafeAreaView style={styles.safeArea} edges={[]}>
        
        <View style={styles.content}>
          {/* App Branding */}
          <View style={styles.brandingContainer}>
            <Text style={styles.appName}>RostrDating</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <AuthButton
              title="CREATE ACCOUNT"
              onPress={handleCreateAccount}
              variant="primary"
              style={styles.createButton}
              textStyle={styles.createButtonText}
            />
            
            <AuthButton
              title="SIGN IN"
              onPress={handleSignIn}
              variant="outline"
              style={styles.signInButton}
              textStyle={styles.signInButtonText}
            />

            {/* Dev Skip Button */}
            <AuthButton
              title="SKIP SIGN IN (DEV)"
              onPress={handleSkipSignIn}
              variant="text"
              style={styles.skipButton}
              textStyle={styles.skipButtonText}
            />
            
            <View style={styles.legalContainer}>
              <Text style={styles.legalText}>
                By tapping Create Account or Sign In, you agree to our{' '}
                <Text style={styles.legalLink}>Terms</Text>. Learn how we process your data in our{' '}
                <Text style={styles.legalLink}>Privacy Policy</Text> and{' '}
                <Text style={styles.legalLink}>Cookies Policy</Text>.
              </Text>
            </View>
          </View>
        </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.light.primary, // Fallback color
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 120, // Increased for full screen
    paddingBottom: 80, // Increased for full screen
  },
  brandingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1,
  },
  buttonContainer: {
    gap: 16,
  },
  createButton: {
    backgroundColor: 'white',
    borderRadius: 24,
    minHeight: 48,
    marginBottom: 8,
  },
  createButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 24,
    minHeight: 48,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  legalContainer: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: 'white',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    marginTop: 16,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});