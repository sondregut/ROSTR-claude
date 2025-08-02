import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/supabase/users';

export default function GenderSetupScreen() {
  const router = useRouter();
  const { user, updateProfileComplete } = useAuth();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleGenderSelect = async (gender: 'male' | 'female' | 'other') => {
    setSelectedGender(gender);
    
    // Automatically submit when gender is selected
    await handleComplete(gender);
  };

  const handleComplete = async (gender: 'male' | 'female' | 'other') => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get user's metadata for name
      const { data: userData } = await supabase.auth.getUser();
      const firstName = userData?.user?.user_metadata?.first_name || 'User';
      const lastName = userData?.user?.user_metadata?.last_name || '';
      const fullName = userData?.user?.user_metadata?.name || `${firstName} ${lastName}`.trim();
      
      // Generate a unique username based on name
      const baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const username = `${baseUsername}_${randomSuffix}`;
      
      // Get existing profile data
      const existingProfile = await UserService.getProfile(user.id);
      
      // Prepare profile data with all required fields
      const profileData: any = {
        username: username,
        name: fullName,
        gender: gender,
        bio: `Hi, I'm ${firstName}!`,
        location: '',
        occupation: '',
        interests: [],
        dating_preferences: {},
        updated_at: new Date().toISOString(),
      };
      
      // Add email or phone based on what's available
      if (user.email) {
        profileData.email = user.email;
      }
      if (user.phone) {
        profileData.phone = user.phone;
      }
      
      // Get age and date_of_birth from existing profile
      if (existingProfile) {
        if (existingProfile.age) profileData.age = existingProfile.age;
        if (existingProfile.date_of_birth) profileData.date_of_birth = existingProfile.date_of_birth;
      }
      
      console.log('Completing profile with data:', profileData);
      
      if (existingProfile) {
        // Update existing profile
        await UserService.updateProfile(user.id, profileData);
      } else {
        // Create new profile
        await UserService.createProfile({ ...profileData, id: user.id });
      }
      
      // Update auth context to mark profile as complete
      updateProfileComplete(true);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Profile completion error:', error);
      
      // If username already exists, try again with a different suffix
      if (error?.message?.includes('duplicate key') && error?.message?.includes('username')) {
        // Re-get user data for error handling
        const { data: retryUserData } = await supabase.auth.getUser();
        const retryFirstName = retryUserData?.user?.user_metadata?.first_name || 'User';
        const retryLastName = retryUserData?.user?.user_metadata?.last_name || '';
        const retryFullName = retryUserData?.user?.user_metadata?.name || `${retryFirstName} ${retryLastName}`.trim();
        
        const newRandomSuffix = Date.now().toString(36);
        const newUsername = `${retryFirstName}${retryLastName}`.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + newRandomSuffix;
        
        try {
          const profileData: any = {
            username: newUsername,
            name: retryFullName,
            gender: gender,
            bio: `Hi, I'm ${retryFirstName}!`,
            location: '',
            occupation: '',
            interests: [],
            dating_preferences: {},
            updated_at: new Date().toISOString(),
          };
          
          if (user.email) profileData.email = user.email;
          if (user.phone) profileData.phone = user.phone;
          
          const existingProfile = await UserService.getProfile(user.id);
          if (existingProfile) {
            await UserService.updateProfile(user.id, profileData);
          } else {
            await UserService.createProfile({ ...profileData, id: user.id });
          }
          
          updateProfileComplete(true);
          router.replace('/(tabs)');
          return;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
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
            <Text style={styles.title}>I am a</Text>
          </View>

          {/* Gender Options */}
          <View style={styles.optionsSection}>
            <Pressable
              style={[
                styles.genderOption,
                selectedGender === 'male' && styles.genderOptionSelected,
                isLoading && styles.genderOptionDisabled
              ]}
              onPress={() => handleGenderSelect('male')}
              disabled={isLoading}
            >
              <Text style={[
                styles.genderOptionText,
                selectedGender === 'male' && styles.genderOptionTextSelected
              ]}>
                Man
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.genderOption,
                selectedGender === 'female' && styles.genderOptionSelected,
                isLoading && styles.genderOptionDisabled
              ]}
              onPress={() => handleGenderSelect('female')}
              disabled={isLoading}
            >
              <Text style={[
                styles.genderOptionText,
                selectedGender === 'female' && styles.genderOptionTextSelected
              ]}>
                Woman
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.genderOption,
                selectedGender === 'other' && styles.genderOptionSelected,
                isLoading && styles.genderOptionDisabled
              ]}
              onPress={() => handleGenderSelect('other')}
              disabled={isLoading}
            >
              <Text style={[
                styles.genderOptionText,
                selectedGender === 'other' && styles.genderOptionTextSelected
              ]}>
                Other
              </Text>
            </Pressable>
          </View>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Setting up your profile...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  optionsSection: {
    flex: 1,
    paddingTop: 24,
  },
  genderOption: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#FE5268',
  },
  genderOptionDisabled: {
    opacity: 0.5,
  },
  genderOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  genderOptionTextSelected: {
    color: 'white',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});