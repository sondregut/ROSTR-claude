import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthTextInput } from '@/components/ui/auth/AuthTextInput';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { PhoneInput } from '@/components/ui/auth/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signUp, isLoading, error, clearError } = useAuth();

  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(phone);
  };


  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (signupMethod === 'email') {
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (!formData.password.trim()) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword.trim()) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // Phone signup validation
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    clearError();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (signupMethod === 'email') {
        await signUp(
          formData.email.trim(),
          formData.password,
          formData.name.trim()
        );
        // Navigation will be handled by the auth state change
      } else {
        // Phone signup - navigate to OTP verification
        router.push({
          pathname: '/(auth)/verify-phone',
          params: {
            phone: formData.phone,
            name: formData.name.trim(),
          },
        });
      }
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Unable to create account. Please try again.');
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

  const handleGoToSignIn = () => {
    router.push('/(auth)/signin');
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
          showsVerticalScrollIndicator={false}
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
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join RostrDating and start tracking your dating journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Signup Method Toggle */}
            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Sign up with:</Text>
              <View style={[styles.toggle, { backgroundColor: colors.border }]}>
                <Pressable
                  style={[
                    styles.toggleOption,
                    signupMethod === 'email' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSignupMethod('email')}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: signupMethod === 'email' ? colors.buttonText : colors.text }
                  ]}>
                    Email
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleOption,
                    signupMethod === 'phone' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSignupMethod('phone')}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: signupMethod === 'phone' ? colors.buttonText : colors.text }
                  ]}>
                    Phone
                  </Text>
                </Pressable>
              </View>
            </View>

            <AuthTextInput
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              error={formErrors.name}
              leftIcon="person"
              autoCapitalize="words"
              autoComplete="name"
              required
            />

            {signupMethod === 'email' ? (
              <>
                <AuthTextInput
                  label="Email"
                  placeholder="Enter your email address"
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
                  placeholder="Create a password"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  error={formErrors.password}
                  leftIcon="lock-closed"
                  isPassword
                  autoComplete="new-password"
                  required
                />

                <AuthTextInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  error={formErrors.confirmPassword}
                  leftIcon="lock-closed"
                  isPassword
                  autoComplete="new-password"
                  required
                />
              </>
            ) : (
              <PhoneInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                error={formErrors.phone}
                placeholder="Enter your phone number"
                required
              />
            )}

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <AuthButton
              title={signupMethod === 'email' ? 'Create Account' : 'Send Verification Code'}
              onPress={handleSignUp}
              isLoading={isLoading}
              style={styles.signUpButton}
            />

            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
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
    marginBottom: 30,
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
  signUpButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
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
  toggleContainer: {
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});