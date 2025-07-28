import React, { useState, useRef, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '@/services/supabase/auth';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer for resend
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleBack = () => {
    router.back();
  };

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newOtp.every(digit => digit)) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const verificationCode = code || otp.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      
      // For now, we'll just use the phone number as the name
      // In the full flow, we'll collect this after verification
      const tempName = 'User';
      
      await AuthService.verifyPhoneOtp(phoneNumber, verificationCode, tempName);
      
      // Navigate to email setup
      router.push('/(auth)/email-setup');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'Invalid verification code. Please try again.';
      if (error?.message?.includes('expired')) {
        errorMessage = 'Verification code has expired. Please request a new one.';
      }
      
      Alert.alert('Error', errorMessage);
      
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    try {
      setIsLoading(true);
      await AuthService.sendPhoneOtp(phoneNumber);
      Alert.alert('Success', 'A new verification code has been sent');
      setResendTimer(30);
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
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
              <Text style={styles.title}>My code is</Text>
            </View>

            {/* OTP Input Section */}
            <View style={styles.otpSection}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isLoading}
                  />
                ))}
              </View>

              <Pressable
                onPress={handleResend}
                disabled={resendTimer > 0 || isLoading}
                style={styles.resendButton}
              >
                <Text style={[
                  styles.resendText,
                  (resendTimer > 0 || isLoading) && styles.resendTextDisabled
                ]}>
                  {resendTimer > 0 
                    ? `Resend code in ${resendTimer}s` 
                    : 'Resend code'
                  }
                </Text>
              </Pressable>
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[
                  styles.continueButton,
                  !otp.every(d => d) && styles.continueButtonDisabled
                ]}
                onPress={() => handleVerify()}
                disabled={isLoading || !otp.every(d => d)}
              >
                <Text style={[
                  styles.continueButtonText,
                  !otp.every(d => d) && styles.continueButtonTextDisabled
                ]}>
                  {isLoading ? 'VERIFYING...' : 'CONTINUE'}
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
  otpSection: {
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    fontSize: 24,
    textAlign: 'center',
    color: '#000',
  },
  resendButton: {
    alignSelf: 'center',
    padding: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#FE5268',
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#999',
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