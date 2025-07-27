import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthTextInput } from '@/components/ui/auth/AuthTextInput';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { resetPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    clearError();
    setEmailError('');
    
    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Unable to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
    clearError();
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleGoToSignIn = () => {
    router.push('/(auth)/signin');
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.successIconText, { color: colors.success }]}>✓</Text>
          </View>
          
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Check Your Email
          </Text>
          
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            We've sent password reset instructions to {email}
          </Text>
          
          <View style={styles.successButtons}>
            <AuthButton
              title="Back to Sign In"
              onPress={handleGoToSignIn}
              style={styles.successButton}
            />
            
            <AuthButton
              title="Resend Email"
              onPress={handleResetPassword}
              variant="outline"
              isLoading={isLoading}
              style={styles.resendButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <AuthButton
              title="← Back"
              onPress={handleGoBack}
              variant="text"
              style={styles.backButton}
              fullWidth={false}
            />
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email address and we'll send you instructions to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <AuthTextInput
              label="Email Address"
              placeholder="Enter your email address"
              value={email}
              onChangeText={handleEmailChange}
              error={emailError}
              leftIcon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
            />

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <AuthButton
              title="Send Reset Instructions"
              onPress={handleResetPassword}
              isLoading={isLoading}
              style={styles.resetButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Remember your password?{' '}
            </Text>
            <AuthButton
              title="Sign In"
              onPress={handleGoToSignIn}
              variant="text"
              style={styles.signInButton}
              fullWidth={false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingLeft: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  form: {
    flex: 1,
    marginBottom: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 16,
  },
  signInButton: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successIconText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  successButtons: {
    width: '100%',
    gap: 16,
  },
  successButton: {
    marginBottom: 8,
  },
  resendButton: {
    marginTop: 8,
  },
});