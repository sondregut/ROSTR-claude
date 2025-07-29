import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { AuthOptionsModal } from '@/components/ui/modals/AuthOptionsModal';
import { supabase } from '@/lib/supabase';

export default function WelcomeScreen() {
  const router = useRouter();
  const { devSkipAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleCreateAccount = () => {
    router.push('/(auth)/create-account');
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleTroubleSigningIn = () => {
    router.push('/(auth)/trouble-signin');
  };

  // Temporary function to clear session for testing
  const handleClearSession = async () => {
    try {
      await supabase.auth.signOut();
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      <View style={styles.container}>
        {/* Tinder-style gradient background */}
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
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              {/* Legal Text */}
              <View style={styles.legalContainer}>
                <Text style={styles.legalText}>
                  By tapping "Create account" or "Sign in", you agree to our{' '}
                  <Text style={styles.legalLink}>Terms</Text>. Learn how we process your data in our{' '}
                  <Text style={styles.legalLink}>Privacy Policy</Text> and{' '}
                  <Text style={styles.legalLink}>Cookies Policy</Text>.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Pressable
                  style={styles.createButton}
                  onPress={handleCreateAccount}
                >
                  <Text style={styles.createButtonText}>CREATE ACCOUNT</Text>
                </Pressable>
                
                <Pressable
                  style={styles.signInButton}
                  onPress={handleSignIn}
                >
                  <Text style={styles.signInButtonText}>SIGN IN</Text>
                </Pressable>
              </View>

              {/* Trouble signing in */}
              <Pressable
                onPress={handleTroubleSigningIn}
                style={styles.troubleButton}
              >
                <Text style={styles.troubleText}>Trouble signing in?</Text>
              </Pressable>

            </View>
          </View>
        </SafeAreaView>

        {/* Auth Options Modal */}
        <AuthOptionsModal 
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
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
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 56,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -1,
    textTransform: 'lowercase',
  },
  bottomSection: {
    paddingBottom: 20,
  },
  legalContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  createButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FE5268',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signInButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  troubleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  troubleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  devButtonsContainer: {
    alignItems: 'center',
  },
});