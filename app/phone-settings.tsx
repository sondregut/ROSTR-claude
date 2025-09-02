import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useSafeUser } from '@/hooks/useSafeUser';
import { UserService } from '@/services/supabase/users';
import { ContactService } from '@/services/contacts/ContactService';
import * as Haptics from 'expo-haptics';

export default function PhoneSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const auth = useSafeAuth();
  const user = auth?.user;
  const safeUser = useSafeUser();
  const userProfile = safeUser?.userProfile;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isLoading, setIsLoading] = useState(false);
  const [allowDiscovery, setAllowDiscovery] = useState(true);
  const [currentPhone, setCurrentPhone] = useState<string | null>(null);

  useEffect(() => {
    // Load existing phone number if available
    if (userProfile?.phone) {
      setCurrentPhone(userProfile.phone);
      // Try to parse country code and number
      const phoneStr = userProfile.phone;
      if (phoneStr.startsWith('+1') && phoneStr.length === 12) {
        setCountryCode('+1');
        setPhoneNumber(formatPhoneNumber(phoneStr.substring(2)));
      } else if (phoneStr.startsWith('+')) {
        // Handle other country codes
        setPhoneNumber(phoneStr);
      }
      setAllowDiscovery(userProfile.allow_phone_discovery ?? true);
    }
  }, [userProfile]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Apply US phone number formatting
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    if (countryCode === '+1') {
      setPhoneNumber(formatPhoneNumber(value));
    } else {
      setPhoneNumber(value);
    }
  };

  const handleSave = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
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
        allow_phone_discovery: allowDiscovery,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success', 
        'Phone number updated successfully. Your friends can now find you through contact discovery.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Phone update error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update phone number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhone = async () => {
    Alert.alert(
      'Remove Phone Number',
      'Are you sure you want to remove your phone number? Friends won\'t be able to find you through contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              await UserService.updateProfile(user!.id, {
                phone: null,
                phone_verified: false,
                allow_phone_discovery: false,
              });
              
              setPhoneNumber('');
              setCurrentPhone(null);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Phone number removed successfully.');
            } catch (error) {
              console.error('Remove phone error:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to remove phone number.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Phone Number',
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Section */}
          <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Adding your phone number helps friends find you through their contacts. 
              Your number is kept private and only used for friend discovery.
            </Text>
          </View>

          {/* Current Phone Display */}
          {currentPhone && (
            <View style={[styles.currentPhoneSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Current Phone Number</Text>
              <Text style={[styles.currentPhone, { color: colors.text }]}>{currentPhone}</Text>
            </View>
          )}

          {/* Phone Input Section */}
          <View style={[styles.inputSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              {currentPhone ? 'Update Phone Number' : 'Add Phone Number'}
            </Text>
            
            <View style={styles.phoneInputContainer}>
              <View style={[styles.countryCodeContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.countryCode, { color: colors.text }]}>{countryCode}</Text>
              </View>
              
              <TextInput
                style={[styles.phoneInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder={countryCode === '+1' ? '123-456-7890' : 'Enter phone number'}
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={countryCode === '+1' ? 12 : 20}
              />
            </View>

            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              We'll use this to help your friends find you
            </Text>
          </View>

          {/* Privacy Settings */}
          <View style={[styles.privacySection, { backgroundColor: colors.card }]}>
            <Pressable
              style={styles.privacyRow}
              onPress={() => {
                setAllowDiscovery(!allowDiscovery);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={styles.privacyInfo}>
                <Text style={[styles.privacyLabel, { color: colors.text }]}>
                  Allow Contact Discovery
                </Text>
                <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>
                  Let friends who have your number find you on RostrDating
                </Text>
              </View>
              <View style={[styles.toggle, { backgroundColor: allowDiscovery ? colors.primary : colors.border }]}>
                <View style={[styles.toggleThumb, { transform: [{ translateX: allowDiscovery ? 22 : 2 }] }]} />
              </View>
            </Pressable>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isLoading || !phoneNumber.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.saveButtonText}>
                    {currentPhone ? 'Update Phone Number' : 'Save Phone Number'}
                  </Text>
                </>
              )}
            </Pressable>

            {currentPhone && (
              <Pressable
                style={[styles.removeButton, { borderColor: colors.error }]}
                onPress={handleRemovePhone}
                disabled={isLoading}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.removeButtonText, { color: colors.error }]}>
                  Remove Phone Number
                </Text>
              </Pressable>
            )}
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            <Text style={[styles.securityText, { color: colors.textSecondary }]}>
              Your phone number is encrypted and never shared publicly
            </Text>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  currentPhoneSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  currentPhone: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  inputSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  helperText: {
    fontSize: 13,
    marginTop: 8,
  },
  privacySection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyInfo: {
    flex: 1,
    marginRight: 16,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    position: 'absolute',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  securityText: {
    fontSize: 12,
    textAlign: 'center',
  },
});