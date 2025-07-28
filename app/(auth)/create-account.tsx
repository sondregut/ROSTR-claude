import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PhoneInput, validatePhoneForCountry } from '@/components/ui/auth/PhoneInput';
import { AuthService } from '@/services/supabase/auth';

export default function CreateAccountScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
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
      console.log('Sending SMS to:', phoneNumber);
      
      // Send SMS verification code using Supabase
      await AuthService.sendPhoneOtp(phoneNumber);
      
      // Navigate to verification screen
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phoneNumber: phoneNumber }
      });
    } catch (error: any) {
      console.error('SMS sending error:', error);
      
      let errorMessage = 'Failed to send verification code. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('Invalid phone number')) {
          errorMessage = 'Please enter a valid phone number.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={handleBack}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={24} color="#666" />
              </Pressable>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>My number is</Text>
            </View>

            {/* Phone Input Section */}
            <View style={styles.inputSection}>
              <PhoneInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder=""
                onboardingStyle={false}
              />
              
              <Text style={styles.helperText}>
                We will send a text with a verification code. Message{' '}
                <Text style={styles.helperTextBreak}>\n</Text>
                and data rates may apply.{' '}
                <Pressable>
                  <Text style={styles.learnMore}>Learn what happens when your number changes.</Text>
                </Pressable>
              </Text>
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.continueButton, !phoneNumber && styles.continueButtonDisabled]}
                onPress={handleContinue}
                disabled={isLoading || !phoneNumber}
              >
                <Text style={[
                  styles.continueButtonText,
                  !phoneNumber && styles.continueButtonTextDisabled
                ]}>
                  {isLoading ? 'SENDING...' : 'CONTINUE'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  titleSection: {
    marginTop: 32,
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    color: '#000',
  },
  inputSection: {
    flex: 1,
  },
  helperText: {
    marginTop: 20,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  helperTextBreak: {
    fontSize: 0,
  },
  learnMore: {
    color: '#666',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    paddingBottom: 32,
  },
  continueButton: {
    backgroundColor: '#FE5268',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: '#999',
  },
});