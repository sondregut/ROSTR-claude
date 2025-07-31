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
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { validateName } from '@/utils/validation';

export default function NameSetupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Validate first name
    const firstNameResult = validateName(firstName);
    if (!firstNameResult.isValid) {
      newErrors.firstName = firstNameResult.error;
      isValid = false;
    }

    // Validate last name
    const lastNameResult = validateName(lastName);
    if (!lastNameResult.isValid) {
      newErrors.lastName = lastNameResult.error;
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    try {
      setIsLoading(true);
      Keyboard.dismiss();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      console.log('📝 Saving name for user:', user.id);
      
      // Use sanitized values
      const sanitizedFirstName = firstNameResult.sanitized || firstName.trim();
      const sanitizedLastName = lastNameResult.sanitized || lastName.trim();
      const fullName = `${sanitizedFirstName} ${sanitizedLastName}`;
      
      // Update user's name in Supabase auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          name: fullName, // Full display name
        },
      });

      if (authError) {
        console.error('❌ Auth update error:', authError);
        throw authError;
      }

      console.log('✅ Auth metadata updated');

      // TODO: Profile creation is temporarily disabled due to schema issues
      // Will be re-enabled after database migration in production
      console.log('⏭️ Skipping profile creation, proceeding to birthday setup');

      // Navigate to birthday setup
      router.push('/(auth)/birthday-setup');
    } catch (error: any) {
      console.error('❌ Name setup error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to save name. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => setIsLoading(false)
          }
        ]
      );
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
            <View style={styles.content}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '50%' }]} />
              </View>
            </View>

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
              <Text style={styles.title}>My full name is</Text>
            </View>

            {/* Name Input Section */}
            <View style={styles.inputSection}>
              <TextInput
                style={[styles.nameInput, errors.firstName && styles.inputError]}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                }}
                placeholder="First name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                editable={!isLoading}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
              
              <TextInput
                style={[styles.nameInput, errors.lastName && styles.inputError]}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                }}
                placeholder="Last name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                editable={!isLoading}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
              
              <Text style={styles.helperText}>
                This is how it will appear in Rostr, and you will not be able to change it
              </Text>
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[
                  styles.continueButton,
                  (!firstName.trim() || !lastName.trim()) && styles.continueButtonDisabled
                ]}
                onPress={handleContinue}
                disabled={isLoading || !firstName.trim() || !lastName.trim()}
              >
                <Text style={[
                  styles.continueButtonText,
                  (!firstName.trim() || !lastName.trim()) && styles.continueButtonTextDisabled
                ]}>
                  {isLoading ? 'SAVING...' : 'CONTINUE'}
                </Text>
              </Pressable>
            </View>
            </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E0E0E0',
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE5268',
    borderRadius: 1.5,
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
  nameInput: {
    fontSize: 18,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  inputError: {
    borderBottomColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
});