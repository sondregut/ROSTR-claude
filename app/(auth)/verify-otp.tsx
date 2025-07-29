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
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const hiddenInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    // Focus hidden input on mount
    setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 100);
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

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(cleanValue);

    // Auto-submit when 6 digits are entered
    if (cleanValue.length === 6) {
      handleVerify(cleanValue);
    }
  };

  const handleVerify = async (code?: string) => {
    const verificationCode = code || otp;
    
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('🔐 Verifying OTP:', {
        phoneNumber,
        codeLength: verificationCode.length,
        code: verificationCode
      });
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          Alert.alert(
            'Verification Timeout',
            'The verification is taking longer than expected. Please try again.',
            [{
              text: 'Try Again',
              onPress: () => handleVerify(verificationCode)
            }]
          );
        }
      }, 30000); // 30 second timeout
      
      // Verify the OTP without providing a name yet
      // We'll collect the name in the next step
      const result = await AuthService.verifyPhoneOtp(phoneNumber, verificationCode);
      
      clearTimeout(timeoutId);
      console.log('✅ OTP verification result:', result);
      
      if (result.user) {
        console.log('🚀 Navigating to name setup...');
        setVerificationComplete(true);
        // Use replace to prevent going back to verification
        router.replace('/(auth)/name-setup');
      } else {
        throw new Error('Verification succeeded but no user returned');
      }
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code
      });
      
      let errorMessage = 'Invalid verification code. Please try again.';
      if (error?.message?.includes('expired')) {
        errorMessage = 'Verification code has expired. Please request a new one.';
      } else if (error?.message?.includes('Invalid token')) {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (error?.message?.includes('User already registered')) {
        errorMessage = 'This phone number is already registered. Please sign in instead.';
      }
      
      Alert.alert('Error', errorMessage);
      
      // Clear OTP input
      setOtp('');
      hiddenInputRef.current?.focus();
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
              <View style={styles.otpWrapper}>
                {/* Invisible input that covers the boxes for manual input */}
                <TextInput
                  ref={hiddenInputRef}
                  value={otp}
                  onChangeText={handleOtpChange}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  style={styles.invisibleInput}
                  maxLength={6}
                  editable={!isLoading}
                  autoFocus
                  caretHidden={true}
                />
                
                {/* Visual OTP boxes */}
                <View style={styles.otpContainer} pointerEvents="none">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.otpBox,
                        otp[index] && styles.otpBoxFilled
                      ]}
                    >
                      <Text style={styles.otpDigit}>{otp[index] || ''}</Text>
                    </View>
                  ))}
                </View>
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
                  otp.length !== 6 && styles.continueButtonDisabled
                ]}
                onPress={() => handleVerify()}
                disabled={isLoading || otp.length !== 6}
              >
                <Text style={[
                  styles.continueButtonText,
                  otp.length !== 6 && styles.continueButtonTextDisabled
                ]}>
                  {isLoading ? 'VERIFYING...' : 'CONTINUE'}
                </Text>
              </Pressable>
              
              {/* Manual continue button if verification is complete but navigation failed */}
              {verificationComplete && (
                <Pressable
                  style={[styles.continueButton, { marginTop: 16 }]}
                  onPress={() => router.replace('/(auth)/name-setup')}
                >
                  <Text style={styles.continueButtonText}>
                    PROCEED TO NEXT STEP
                  </Text>
                </Pressable>
              )}
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
  otpWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invisibleInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 20,
    letterSpacing: 30,
    paddingHorizontal: 20,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderBottomColor: '#FE5268',
  },
  otpDigit: {
    fontSize: 24,
    color: '#000',
    fontWeight: '500',
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
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