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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      // TODO: Implement code verification
      console.log('Verifying code:', codeToVerify, 'for phone:', phoneNumber);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to profile setup
      router.push('/(auth)/profile-setup');
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
      // Clear the code
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    try {
      setIsLoading(true);
      // TODO: Implement resend SMS
      console.log('Resending SMS to:', phoneNumber);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset timer
      setResendTimer(30);
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    
    // Keep the original phone number as-is for international numbers
    // Only apply US formatting if it's a US number (starts with +1)
    if (phone.startsWith('+1')) {
      const cleaned = phone.replace(/^\+1/, '').replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    
    // For international numbers, just return as-is with proper spacing
    return phone.replace(/^(\+\d{1,3})(\d+)$/, '$1 $2');
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
              <Text style={styles.title}>Enter the code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{'\n'}
                <Text style={styles.phoneText}>{formatPhoneNumber(phoneNumber || '')}</Text>
              </Text>
            </View>

            {/* Code Input */}
            <View style={styles.inputContainer}>
              <View style={styles.codeInputContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled
                    ]}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>
              
              <View style={styles.resendContainer}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend code in {resendTimer}s
                  </Text>
                ) : (
                  <Pressable
                    onPress={handleResendCode}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.resendButton,
                      pressed && styles.pressed
                    ]}
                  >
                    <Text style={styles.resendButtonText}>
                      Resend code
                    </Text>
                  </Pressable>
                )}
              </View>
              
              <AuthButton
                title={isLoading ? "Verifying..." : "Continue"}
                onPress={() => handleVerifyCode()}
                isLoading={isLoading}
                variant="primary"
                style={styles.continueButton}
                textStyle={styles.continueButtonText}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Didn't receive the code? Check your spam folder or try resending.
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
  phoneText: {
    fontWeight: '600',
    color: Colors.light.text,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
  },
  codeInputFilled: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.card,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendTimerText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
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