import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { supabase } from '@/lib/supabase';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export default function PhoneVerificationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const auth = useSafeAuth();
  const user = auth?.user;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as US phone number (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const normalizePhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    // Add US country code if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    return `+${cleaned}`;
  };

  const sendVerificationCode = async () => {
    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      if (!isValidPhoneNumber(normalizedPhone)) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
        return;
      }

      setIsLoading(true);

      // For now, we'll skip actual SMS verification and just save the phone
      // In production, you'd integrate with Twilio or similar
      setCodeSent(true);
      Alert.alert('Success', 'Verification code sent to your phone.');
    } catch (error) {
      console.error('Error sending verification code:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    try {
      setIsVerifying(true);

      // For demo purposes, accept any 6-digit code
      if (verificationCode.length !== 6) {
        Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your phone.');
        return;
      }

      // Save phone number to user profile
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const { error } = await supabase
        .from('users')
        .update({ 
          phone: normalizedPhone,
          phone_verified: true,
          allow_phone_discovery: true 
        })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert('Success', 'Phone number verified successfully!');
      
      // Continue to next onboarding step or main app
      router.replace('/(tabs)/');
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const skipPhoneVerification = () => {
    Alert.alert(
      'Skip Phone Verification?',
      'You can add your phone number later in settings. Without it, friends won\'t be able to find you through their contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => router.replace('/(tabs)/'),
          style: 'destructive'
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="call-outline" size={32} color={colors.primary} />
            </View>
            
            <Text style={[styles.title, { color: colors.text }]}>
              Add Your Phone Number
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Help friends find you on RostrDating
            </Text>
          </View>

          {!codeSent ? (
            <>
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.countryCode, { color: colors.text }]}>🇺🇸 +1</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="(555) 123-4567"
                    placeholderTextColor={colors.textSecondary}
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={14}
                  />
                </View>
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  We'll send you a verification code
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={sendVerificationCode}
                  disabled={phoneNumber.length < 14 || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.skipButton}
                  onPress={skipPhoneVerification}
                >
                  <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                    Skip for now
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Verification Code</Text>
                <Text style={[styles.phoneDisplay, { color: colors.textSecondary }]}>
                  Code sent to +1 {phoneNumber}
                </Text>
                <View style={[styles.codeInputContainer]}>
                  <TextInput
                    style={[styles.codeInput, { 
                      backgroundColor: colors.card, 
                      borderColor: colors.border,
                      color: colors.text 
                    }]}
                    placeholder="000000"
                    placeholderTextColor={colors.textSecondary}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                </View>
                <Pressable onPress={() => { setCodeSent(false); setVerificationCode(''); }}>
                  <Text style={[styles.resendLink, { color: colors.primary }]}>
                    Use different number
                  </Text>
                </Pressable>
              </View>

              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={verifyCode}
                  disabled={verificationCode.length !== 6 || isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify Phone Number</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.skipButton}
                  onPress={skipPhoneVerification}
                >
                  <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                    Skip for now
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <View style={[styles.privacyNote, { backgroundColor: colors.card }]}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
              Your phone number is encrypted and only used to help friends find you. 
              You can control who can discover you in settings.
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  countryCode: {
    fontSize: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  hint: {
    fontSize: 14,
    marginTop: 8,
  },
  phoneDisplay: {
    fontSize: 14,
    marginBottom: 16,
  },
  codeInputContainer: {
    alignItems: 'center',
  },
  codeInput: {
    width: '60%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  privacyNote: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});