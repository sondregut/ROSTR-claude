import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/supabase/users';

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | '';
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateProfileComplete } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateOfBirthChange = (text: string) => {
    // Format as MM/DD/YYYY
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    }
    
    setFormData(prev => ({ ...prev, dateOfBirth: formatted }));
  };

  const validateAge = (dateString: string) => {
    const [month, day, year] = dateString.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  };

  const handleContinue = async () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }

    if (!formData.dateOfBirth.trim() || formData.dateOfBirth.length !== 10) {
      Alert.alert('Error', 'Please enter a valid date of birth (MM/DD/YYYY)');
      return;
    }

    const age = validateAge(formData.dateOfBirth);
    if (age < 18) {
      Alert.alert('Age Requirement', 'You must be at least 18 years old to use RostrDating');
      return;
    }

    if (!formData.gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      
      // Format date for database (YYYY-MM-DD)
      const [month, day, year] = formData.dateOfBirth.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Calculate age from date of birth
      const birthDate = new Date(formattedDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      // Create or update user profile - matching the database schema
      const profileData: any = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        username: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // Unique username
        age: age,
        gender: formData.gender, // This should match the enum type
        date_of_birth: formattedDate, // Store both age and date_of_birth
        bio: `Hi, I'm ${formData.firstName}!`,
        location: '',
        occupation: '',
        interests: [],
        dating_preferences: {}, // Empty object for now
        updated_at: new Date().toISOString(),
      };
      
      // Add email or phone based on what's available
      if (user.email) {
        profileData.email = user.email;
      }
      if (user.phone) {
        profileData.phone = user.phone;
      }
      
      console.log('Profile data to save:', profileData);
      console.log('User info:', { id: user.id, email: user.email, phone: user.phone });
      
      // Check if profile already exists
      console.log('Checking for existing profile...');
      const existingProfile = await UserService.getProfile(user.id);
      console.log('Existing profile:', existingProfile);
      
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile...');
        const updateResult = await UserService.updateProfile(user.id, profileData);
        console.log('Update result:', updateResult);
      } else {
        // Create new profile
        console.log('Creating new profile...');
        const createResult = await UserService.createProfile({ ...profileData, id: user.id });
        console.log('Create result:', createResult);
      }
      
      // Update auth context to mark profile as complete
      updateProfileComplete(true);
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Profile setup error:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      
      // More specific error messages
      let errorMessage = 'Failed to setup profile. Please try again.';
      
      if (error?.message?.includes('duplicate key') && error?.message?.includes('username')) {
        errorMessage = 'Username already taken. Please try again.';
        // Auto-generate a new username and retry
        const newUsername = `${formData.firstName.toLowerCase()}_${Date.now().toString(36)}`;
        console.log('Retrying with new username:', newUsername);
        profileData.username = newUsername;
        
        try {
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
      } else if (error?.message?.includes('violates check constraint')) {
        errorMessage = 'Please check your information and try again. ' + error.message;
      } else if (error?.code === 'PGRST301') {
        errorMessage = 'Database configuration error. Please contact support.';
      } else if (error?.message?.includes('null value in column')) {
        errorMessage = 'Missing required information. Error: ' + error.message;
      }
      
      Alert.alert('Profile Setup Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const GenderButton = ({ 
    value, 
    label, 
    selected 
  }: { 
    value: FormData['gender']; 
    label: string; 
    selected: boolean 
  }) => (
    <AuthButton
      title={label}
      onPress={() => handleInputChange('gender', value)}
      variant={selected ? 'primary' : 'outline'}
      style={[
        styles.genderButton,
        selected ? styles.genderButtonSelected : styles.genderButtonUnselected
      ]}
      textStyle={[
        styles.genderButtonText,
        selected ? styles.genderButtonTextSelected : styles.genderButtonTextUnselected
      ]}
    />
  );

  return (
    <>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.secondary]} 
        style={styles.container}
        start={{ x: 0.1, y: 0.2 }}
        end={{ x: 0.9, y: 1.0 }}
      >
        <SafeAreaView style={styles.safeArea} edges={[]}>
          <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Complete your profile</Text>
              <Text style={styles.subtitle}>
                Let's get to know you better. This information helps us create a better experience.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  placeholder="Enter your first name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoComplete="given-name"
                  textContentType="givenName"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  placeholder="Enter your last name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoComplete="family-name"
                  textContentType="familyName"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.dateOfBirth}
                  onChangeText={handleDateOfBirthChange}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text style={styles.helperText}>
                  You must be 18 or older to use RostrDating
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderContainer}>
                  <GenderButton
                    value="male"
                    label="Male"
                    selected={formData.gender === 'male'}
                  />
                  <GenderButton
                    value="female"
                    label="Female"
                    selected={formData.gender === 'female'}
                  />
                  <GenderButton
                    value="other"
                    label="Other"
                    selected={formData.gender === 'other'}
                  />
                </View>
              </View>
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <AuthButton
                title={isLoading ? "Setting up..." : "Complete Setup"}
                onPress={handleContinue}
                isLoading={isLoading}
                variant="primary"
                style={styles.continueButton}
                textStyle={styles.continueButtonText}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Your information is secure and will only be used to enhance your dating experience.
              </Text>
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
    paddingHorizontal: 32,
    paddingTop: 80, // Increased for full screen
    paddingBottom: 60, // Increased for full screen
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  formContainer: {
    gap: 24,
    marginBottom: 40,
  },
  formGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderRadius: 12,
    minHeight: 48,
  },
  genderButtonSelected: {
    backgroundColor: Colors.light.primary,
  },
  genderButtonUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonTextSelected: {
    color: 'white',
  },
  genderButtonTextUnselected: {
    color: 'white',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: 'white',
    borderRadius: 24,
    minHeight: 52,
  },
  continueButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
});