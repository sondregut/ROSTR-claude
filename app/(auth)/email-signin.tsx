import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { simpleAuth } from '@/services/supabase/simpleAuth';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function EmailSignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleBack = () => {
    router.back();
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Validate email
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
      isValid = false;
    }

    // Validate password - just check if it's provided for sign in
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Use sanitized email
      const emailResult = validateEmail(email);
      const result = await simpleAuth.signInWithEmail(
        emailResult.sanitized || email, 
        password
      );

      if (result.error) {
        throw result.error;
      }

      if (result.user) {
        // Success! Navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        Alert.alert('Sign In Failed', 'Invalid email or password. Please try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        Alert.alert('Email Not Verified', 'Please check your email and verify your account first.');
      } else {
        Alert.alert('Sign In Failed', error.message || 'Failed to sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Please enter your email address first');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await simpleAuth.resetPassword(email);
      
      if (error) {
        throw error;
      }

      Alert.alert(
        'Check Your Email',
        'We\'ve sent you a password reset link. Please check your email.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </Pressable>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </Pressable>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <Pressable
              onPress={handleForgotPassword}
              style={styles.forgotPasswordButton}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </Pressable>

            <View style={styles.signUpPrompt}>
              <Text style={styles.signUpPromptText}>
                Don't have an account?{' '}
                <Text 
                  style={styles.signUpLink} 
                  onPress={() => router.replace('/(auth)/email-signup')}
                >
                  Sign up
                </Text>
              </Text>
            </View>
          </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginTop: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8F8F8',
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FE5268',
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#FE5268',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpPrompt: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 40,
  },
  signUpPromptText: {
    fontSize: 15,
    color: '#666',
  },
  signUpLink: {
    color: '#FE5268',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});