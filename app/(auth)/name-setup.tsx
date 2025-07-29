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

export default function NameSetupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      Alert.alert('Error', 'Names must be at least 2 characters');
      return;
    }

    try {
      setIsLoading(true);
      Keyboard.dismiss();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      console.log('📝 Saving name for user:', user.id);
      
      // Update user's name in Supabase auth metadata
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
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
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={['top']}>
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
                style={styles.nameInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                editable={!isLoading}
              />
              
              <TextInput
                style={styles.nameInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                editable={!isLoading}
              />
              
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
});