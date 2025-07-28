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

export default function SignInScreen() {
  const router = useRouter();
  // Force light mode for onboarding
  const colors = Colors.light;
  const { signIn, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return emailRegex.test(email) || phoneRegex.test(email);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      errors.email = 'Email or phone number is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email or phone number';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    clearError();
    
    if (!validateForm()) {
      return;
    }

    try {
      await signIn(formData.email.trim(), formData.password);
      // Navigation will be handled by the auth state change
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Unable to sign in. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    clearError();
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleGoToSignUp = () => {
    router.push('/(auth)/signup');
  };

  const handleGoBack = () => {
    router.back();
  };

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
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to your account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <AuthTextInput
              label="Email or Phone"
              placeholder="Enter your email or phone number"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              error={formErrors.email}
              leftIcon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
            />

            <AuthTextInput
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              error={formErrors.password}
              leftIcon="lock-closed"
              isPassword
              autoComplete="password"
              required
            />

            <AuthButton
              title="Forgot Password?"
              onPress={handleForgotPassword}
              variant="text"
              style={styles.forgotButton}
              fullWidth={false}
            />

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <AuthButton
              title="Sign In"
              onPress={handleSignIn}
              isLoading={isLoading}
              style={styles.signInButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <AuthButton
              title="Create Account"
              onPress={handleGoToSignUp}
              variant="text"
              style={styles.signUpButton}
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingRight: 0,
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
  signInButton: {
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
  signUpButton: {
    paddingLeft: 0,
    paddingRight: 0,
  },
});