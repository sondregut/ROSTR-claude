import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { Colors } from '@/constants/Colors';
import { PhoneInput, validatePhoneForCountry } from '@/components/ui/auth/PhoneInput';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Use country-specific validation
    if (!validatePhoneForCountry(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number for the selected country');
      return;
    }

    try {
      setIsLoading(true);
      // TODO: Implement SMS verification
      console.log('Sending SMS to:', phoneNumber);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to verification screen
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { phoneNumber: phoneNumber }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor={Colors.light.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
                <Ionicons name="chevron-back" size={28} color={Colors.light.text} />
              </Pressable>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>My number is</Text>
              <Text style={styles.subtitle}>
                We'll send you a login code. Standard rates may apply.
              </Text>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <PhoneInput
                label=""
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                onboardingStyle={false}
              />
              
              <AuthButton
                title={isLoading ? "Sending..." : "Continue"}
                onPress={handleSendCode}
                isLoading={isLoading}
                variant="primary"
                style={styles.continueButton}
                textStyle={styles.continueButtonText}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to receive SMS messages from RostrDating. 
                Message and data rates may apply.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80, // Increased for full screen
    paddingBottom: 60, // Increased for full screen
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pressed: {
    opacity: 0.7,
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 24,
    minHeight: 52,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});