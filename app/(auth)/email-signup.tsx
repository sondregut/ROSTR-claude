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
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { validateEmail, validatePassword, validateName } from '@/utils/validation';

export default function EmailSignUpScreen() {
  const router = useRouter();
  const auth = useSafeAuth();
  const signUp = auth?.signUp;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleBack = () => {
    router.back();
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Validate full name
    const nameResult = validateName(fullName);
    if (!nameResult.isValid) {
      newErrors.fullName = nameResult.error;
      isValid = false;
    }

    // Validate email
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
      isValid = false;
    }

    // Validate password
    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.error;
      isValid = false;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Use sanitized values
      const nameResult = validateName(fullName);
      const emailResult = validateEmail(email);
      
      if (!signUp) {
        throw new Error('Authentication not available');
      }
      
      await signUp(
        emailResult.sanitized || email, 
        password, 
        nameResult.sanitized || fullName
      );
      // If signup succeeds, the AuthenticatedApp will handle navigation
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      if (error.message?.includes('already registered')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign In', 
              onPress: () => router.replace('/(auth)/email-signin')
            }
          ]
        );
      } else {
        Alert.alert('Sign Up Failed', error.message || 'Failed to create account');
      }
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Find your perfect match on Rostr</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                }}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

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
                  placeholder="Create a password"
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <Pressable
              style={[styles.signUpButton, isLoading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </Pressable>

            <View style={styles.signInPrompt}>
              <Text style={styles.signInPromptText}>
                Already have an account?{' '}
                <Text 
                  style={styles.signInLink} 
                  onPress={() => router.replace('/(auth)/email-signin')}
                >
                  Sign in
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
  signUpButton: {
    backgroundColor: '#FE5268',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 24,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInPrompt: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 40,
  },
  signInPromptText: {
    fontSize: 15,
    color: '#666',
  },
  signInLink: {
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