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

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | '';
}

export default function ProfileSetupScreen() {
  const router = useRouter();
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

    try {
      setIsLoading(true);
      // TODO: Save profile data and complete registration
      console.log('Setting up profile:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to setup profile. Please try again.');
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
    <View style={styles.fullScreen}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor={Colors.light.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
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
                  placeholderTextColor={Colors.light.textSecondary}
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
                  placeholderTextColor={Colors.light.textSecondary}
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
                  placeholderTextColor={Colors.light.textSecondary}
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
    color: Colors.light.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
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
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonTextSelected: {
    color: 'white',
  },
  genderButtonTextUnselected: {
    color: Colors.light.text,
  },
  buttonContainer: {
    marginBottom: 24,
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
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});