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
import { Ionicons } from '@expo/vector-icons';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { Colors } from '@/constants/Colors';

export default function AuthMethodScreen() {
  const router = useRouter();

  const handlePhoneAuth = () => {
    router.push('/(auth)/phone-auth');
  };

  const handleEmailAuth = () => {
    router.push('/(auth)/email-auth');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.secondary]} 
        style={styles.container}
        start={{ x: 0.1, y: 0.2 }}
        end={{ x: 0.9, y: 1.0 }}
      >
        <SafeAreaView style={styles.safeArea} edges={[]}>
          <View style={styles.content}>
          {/* Header with back button */}
          <View style={styles.header}>
            <Pressable
              onPress={handleGoBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed
              ]}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </Pressable>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>My number is</Text>
            <Text style={styles.subtitle}>
              We'll send you a login code. Standard rates may apply.
            </Text>
          </View>

          {/* Auth Method Buttons */}
          <View style={styles.buttonContainer}>
            <AuthButton
              title="Continue with Phone"
              onPress={handlePhoneAuth}
              variant="primary"
              style={styles.methodButton}
              textStyle={styles.methodButtonText}
              leftIcon="call"
            />
            
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <AuthButton
              title="Continue with Email"
              onPress={handleEmailAuth}
              variant="outline"
              style={styles.emailButton}
              textStyle={styles.emailButtonText}
              leftIcon="mail"
            />
            
            <View style={styles.troubleContainer}>
              <Text style={styles.troubleText}>
                Trouble logging in?{' '}
                <Text style={styles.troubleLink}>Get help</Text>
              </Text>
            </View>
          </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
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
    paddingHorizontal: 32,
    paddingTop: 80, // Increased for full screen
    paddingBottom: 80, // Increased for full screen
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  titleContainer: {
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  methodButton: {
    backgroundColor: 'white',
    borderRadius: 24,
    minHeight: 52,
  },
  methodButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  emailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 24,
    minHeight: 52,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  troubleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  troubleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  troubleLink: {
    textDecorationLine: 'underline',
    color: 'white',
    fontWeight: '500',
  },
});