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
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/supabase/users';
import { ContactService } from '@/services/contacts/ContactService';

export default function PhoneSetupScreen() {
  const router = useRouter();
  const { user, updateProfileComplete } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1'); // Default to US
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as US phone number (xxx) xxx-xxxx
    if (countryCode === '+1') {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
      }
    }
    
    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleSkip = () => {
    // Allow users to skip phone setup
    updateProfileComplete(true);
    router.replace('/(tabs)');
  };

  const handleContinue = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number or skip this step');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      
      // Normalize phone number to E.164 format
      const normalizedPhone = ContactService.normalizePhoneNumber(
        countryCode + phoneNumber.replace(/\D/g, '')
      );
      
      console.log('Saving phone number:', normalizedPhone);
      
      // Update user profile with phone number
      await UserService.updateProfile(user.id, {
        phone: normalizedPhone,
        phone_verified: false,
        allow_phone_discovery: true,
      });
      
      console.log('Phone number saved successfully');
      
      // Mark profile as complete and navigate to main app
      updateProfileComplete(true);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Phone setup error:', error);
      Alert.alert('Error', 'Failed to save phone number. You can add it later in settings.');
      
      // Still allow them to continue
      updateProfileComplete(true);
      router.replace('/(tabs)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3']}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="call-outline" size={64} color="white" />
              </View>
              
              <Text style={styles.title}>Add Your Phone Number</Text>
              <Text style={styles.subtitle}>
                Help your friends find you on RostrDating
              </Text>
              <Text style={styles.description}>
                Your phone number lets friends who have your contact discover you automatically. 
                It's optional and you can control this in settings.
              </Text>

              <View style={styles.inputContainer}>
                <View style={styles.phoneInputRow}>
                  <Pressable style={styles.countryCodeButton}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                  </Pressable>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="(555) 123-4567"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    maxLength={14} // Format: (xxx) xxx-xxxx
                  />
                </View>
              </View>

              <View style={styles.privacyNote}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.privacyText}>
                  Your phone number is private and only used for friend discovery
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <AuthButton
                  title="Continue"
                  onPress={handleContinue}
                  loading={isLoading}
                  style={styles.continueButton}
                />
                
                <Pressable onPress={handleSkip} style={styles.skipButton}>
                  <Text style={styles.skipText}>Skip for now</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  countryCodeButton: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: 'white',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    marginBottom: 16,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
});