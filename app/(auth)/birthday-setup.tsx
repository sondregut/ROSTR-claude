import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function BirthdaySetupScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateString, setDateString] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateAge = (date: Date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
      setDateString(formatDate(selectedDate));
    }
  };

  const handleContinue = async () => {
    const age = calculateAge(birthDate);
    
    if (age < 18) {
      Alert.alert('Age Requirement', 'You must be 18 or older to use this app');
      return;
    }
    
    if (age > 100) {
      Alert.alert('Invalid Date', 'Please enter a valid birth date');
      return;
    }

    try {
      setIsLoading(true);
      
      // Update user's birthday in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          birthday: birthDate.toISOString(),
          age: age,
        },
      });

      if (error) {
        throw error;
      }

      // Update the user profile in the database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            birthday: birthDate.toISOString(),
            age: age,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });
          
        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      // Refresh user context
      await refreshUser();
      
      // Navigate to main app - auth flow complete!
      router.replace('/(tabs)/');
    } catch (error: any) {
      console.error('Birthday update error:', error);
      Alert.alert('Error', 'Failed to save birthday. Please try again.');
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
            <Text style={styles.title}>My birthday is</Text>
          </View>

          {/* Date Input Section */}
          <View style={styles.inputSection}>
            <Pressable
              style={styles.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <TextInput
                style={styles.dateInput}
                value={dateString}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#999"
                editable={false}
              />
            </Pressable>
            
            <Text style={styles.helperText}>
              Your age will be public.
            </Text>

            {(showDatePicker || Platform.OS === 'ios') && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                style={styles.datePicker}
              />
            )}
          </View>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.continueButton,
                !dateString && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={isLoading || !dateString}
            >
              <Text style={[
                styles.continueButtonText,
                !dateString && styles.continueButtonTextDisabled
              ]}>
                {isLoading ? 'SAVING...' : 'CONTINUE'}
              </Text>
            </Pressable>
          </View>
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
  inputSection: {
    flex: 1,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateInput: {
    fontSize: 18,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  datePicker: {
    marginTop: 20,
    height: 200,
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