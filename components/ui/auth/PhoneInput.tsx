import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { 
  parsePhoneNumberFromString, 
  getCountryCallingCode, 
  getExampleNumber,
  CountryCode as LibPhoneCountryCode,
  type Examples
} from 'libphonenumber-js';

interface PhoneInputProps {
  label: string;
  value: string;
  onChangeText: (phone: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  onboardingStyle?: boolean;
}

interface CountryData {
  code: string;
  country: string;
  iso: LibPhoneCountryCode;
  flag: string;
}

// Country data with proper libphonenumber country codes
const COUNTRIES: CountryData[] = [
  { code: '+1', country: 'United States', iso: 'US' as LibPhoneCountryCode, flag: '🇺🇸' },
  { code: '+1', country: 'Canada', iso: 'CA' as LibPhoneCountryCode, flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', iso: 'GB' as LibPhoneCountryCode, flag: '🇬🇧' },
  { code: '+33', country: 'France', iso: 'FR' as LibPhoneCountryCode, flag: '🇫🇷' },
  { code: '+49', country: 'Germany', iso: 'DE' as LibPhoneCountryCode, flag: '🇩🇪' },
  { code: '+47', country: 'Norway', iso: 'NO' as LibPhoneCountryCode, flag: '🇳🇴' },
  { code: '+46', country: 'Sweden', iso: 'SE' as LibPhoneCountryCode, flag: '🇸🇪' },
  { code: '+45', country: 'Denmark', iso: 'DK' as LibPhoneCountryCode, flag: '🇩🇰' },
  { code: '+31', country: 'Netherlands', iso: 'NL' as LibPhoneCountryCode, flag: '🇳🇱' },
  { code: '+41', country: 'Switzerland', iso: 'CH' as LibPhoneCountryCode, flag: '🇨🇭' },
  { code: '+43', country: 'Austria', iso: 'AT' as LibPhoneCountryCode, flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', iso: 'BE' as LibPhoneCountryCode, flag: '🇧🇪' },
  { code: '+39', country: 'Italy', iso: 'IT' as LibPhoneCountryCode, flag: '🇮🇹' },
  { code: '+34', country: 'Spain', iso: 'ES' as LibPhoneCountryCode, flag: '🇪🇸' },
  { code: '+351', country: 'Portugal', iso: 'PT' as LibPhoneCountryCode, flag: '🇵🇹' },
  { code: '+48', country: 'Poland', iso: 'PL' as LibPhoneCountryCode, flag: '🇵🇱' },
  { code: '+420', country: 'Czech Republic', iso: 'CZ' as LibPhoneCountryCode, flag: '🇨🇿' },
  { code: '+36', country: 'Hungary', iso: 'HU' as LibPhoneCountryCode, flag: '🇭🇺' },
  { code: '+358', country: 'Finland', iso: 'FI' as LibPhoneCountryCode, flag: '🇫🇮' },
  { code: '+372', country: 'Estonia', iso: 'EE' as LibPhoneCountryCode, flag: '🇪🇪' },
  { code: '+371', country: 'Latvia', iso: 'LV' as LibPhoneCountryCode, flag: '🇱🇻' },
  { code: '+370', country: 'Lithuania', iso: 'LT' as LibPhoneCountryCode, flag: '🇱🇹' },
  { code: '+353', country: 'Ireland', iso: 'IE' as LibPhoneCountryCode, flag: '🇮🇪' },
  { code: '+354', country: 'Iceland', iso: 'IS' as LibPhoneCountryCode, flag: '🇮🇸' },
  { code: '+81', country: 'Japan', iso: 'JP' as LibPhoneCountryCode, flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', iso: 'KR' as LibPhoneCountryCode, flag: '🇰🇷' },
  { code: '+86', country: 'China', iso: 'CN' as LibPhoneCountryCode, flag: '🇨🇳' },
  { code: '+91', country: 'India', iso: 'IN' as LibPhoneCountryCode, flag: '🇮🇳' },
  { code: '+61', country: 'Australia', iso: 'AU' as LibPhoneCountryCode, flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', iso: 'NZ' as LibPhoneCountryCode, flag: '🇳🇿' },
].sort((a, b) => a.country.localeCompare(b.country));

export function PhoneInput({
  label,
  value,
  onChangeText,
  error,
  placeholder = "Enter your phone number",
  required = false,
  onboardingStyle = false,
}: PhoneInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(
    COUNTRIES.find(c => c.iso === 'US') || COUNTRIES[0]
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse the current phone number to determine country and formatting
  const parsedNumber = useMemo(() => {
    if (!value) return null;
    
    try {
      return parsePhoneNumberFromString(value);
    } catch (error) {
      return null;
    }
  }, [value]);

  // Update selected country when parsed number changes
  React.useEffect(() => {
    if (parsedNumber && parsedNumber.country) {
      const matchingCountry = COUNTRIES.find(c => c.iso === parsedNumber.country);
      if (matchingCountry && matchingCountry.iso !== selectedCountry.iso) {
        setSelectedCountry(matchingCountry);
      }
    }
  }, [parsedNumber, selectedCountry.iso]);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    
    const query = searchQuery.toLowerCase();
    return COUNTRIES.filter(country => 
      country.country.toLowerCase().includes(query) ||
      country.code.includes(query) ||
      country.iso.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handlePhoneChange = (input: string) => {
    try {
      // Try to parse the input with the selected country context
      const phoneNumber = parsePhoneNumberFromString(input, selectedCountry.iso);
      
      if (phoneNumber) {
        // Use E.164 format for the value (e.g., "+4741234567")
        onChangeText(phoneNumber.format('E.164'));
      } else {
        // If parsing fails, try without country context
        const globalNumber = parsePhoneNumberFromString(input);
        if (globalNumber) {
          onChangeText(globalNumber.format('E.164'));
        } else {
          // If still no valid number, pass the raw input
          onChangeText(input);
        }
      }
    } catch (error) {
      // If all parsing fails, pass the raw input
      onChangeText(input);
    }
  };

  const getDisplayValue = () => {
    if (parsedNumber && parsedNumber.isValid()) {
      // Use national format for display since country code is shown in selector
      const nationalFormat = parsedNumber.formatNational();
      // Remove any leading country code that might appear
      return nationalFormat.replace(/^\+\d+\s*/, '');
    } else if (parsedNumber) {
      // Show partial formatting even for incomplete numbers
      try {
        const nationalFormat = parsedNumber.formatNational();
        return nationalFormat.replace(/^\+\d+\s*/, '');
      } catch (error) {
        return value;
      }
    } else if (value) {
      // Fallback to raw value if parsing fails
      return value;
    }
    return '';
  };

  const selectCountry = (country: CountryData) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setSearchQuery('');
    
    // If there's an existing number, try to preserve the local part
    if (parsedNumber && parsedNumber.nationalNumber) {
      try {
        const newNumber = parsePhoneNumberFromString(parsedNumber.nationalNumber, country.iso);
        if (newNumber) {
          onChangeText(newNumber.format('E.164'));
        }
      } catch (error) {
        // If conversion fails, just update country - user can re-enter number
      }
    }
  };

  const getPlaceholderText = (): string => {
    try {
      const exampleNumber = getExampleNumber(selectedCountry.iso, 'default' as Examples);
      if (exampleNumber) {
        // For display, show without country code since that's already shown in selector
        const nationalFormat = exampleNumber.formatNational();
        // Remove leading country code if present (e.g., "412 34 567" instead of "+47 412 34 567")
        return nationalFormat.replace(/^\+\d+\s*/, '');
      }
    } catch (error) {
      // Fallback based on country
      if (selectedCountry.iso === 'NO') {
        return '412 34 567';
      } else if (selectedCountry.iso === 'US' || selectedCountry.iso === 'CA') {
        return '(555) 123-4567';
      } else if (selectedCountry.iso === 'GB') {
        return '7911 123456';
      }
    }
    return placeholder;
  };

  const toggleCountryPicker = () => {
    setShowCountryPicker(!showCountryPicker);
    setSearchQuery('');
  };

  const closeCountryPicker = () => {
    setShowCountryPicker(false);
    setSearchQuery('');
  };

  // Define onboarding styles
  const onboardingInputStyles = onboardingStyle ? {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderRadius: 0,
  } : {
    backgroundColor: colors.card,
    borderColor: error ? colors.error : colors.border,
  };

  const onboardingTextStyles = onboardingStyle ? {
    color: '#000',
  } : {
    color: colors.text,
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, onboardingTextStyles]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        onboardingInputStyles
      ]}>
        {/* Country Code Selector */}
        <Pressable
          style={[
            styles.countrySelector, 
            { 
              borderColor: onboardingStyle ? '#E0E0E0' : colors.border,
              borderRightWidth: onboardingStyle ? 1 : 1,
              paddingHorizontal: onboardingStyle ? 16 : 14,
            }
          ]}
          onPress={toggleCountryPicker}
          accessibilityLabel={`Selected country: ${selectedCountry.country} ${selectedCountry.code}`}
          accessibilityRole="button"
        >
          <Text style={[styles.countryCode, onboardingTextStyles, onboardingStyle && { fontSize: 18 }]}>
            {selectedCountry.code}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={14} 
            color={onboardingStyle ? '#666' : colors.textSecondary}
          />
        </Pressable>
        
        {/* Phone Number Input */}
        <TextInput
          style={[styles.phoneInput, onboardingTextStyles, onboardingStyle && { fontSize: 18 }]}
          value={getDisplayValue()}
          onChangeText={handlePhoneChange}
          placeholder={getPlaceholderText()}
          placeholderTextColor={onboardingStyle ? '#999' : colors.textSecondary}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="none"
        transparent={true}
        presentationStyle="overFullScreen"
        onRequestClose={closeCountryPicker}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <SafeAreaView 
                style={[styles.modalContent, { backgroundColor: colors.background }]}
                edges={['top', 'bottom']}
              >
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Select Country
                  </Text>
                  <Pressable
                    onPress={closeCountryPicker}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.pressed
                    ]}
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </Pressable>
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <View style={[styles.searchInputContainer, { 
                    backgroundColor: colors.card,
                    borderColor: colors.border 
                  }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Search countries..."
                      placeholderTextColor={colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Countries List */}
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item, index) => `${item.code}-${item.iso}-${index}`}
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ pressed }) => [
                        styles.countryOption,
                        {
                          backgroundColor: selectedCountry.iso === item.iso 
                            ? colors.primary + '20' 
                            : pressed 
                            ? colors.border 
                            : 'transparent'
                        }
                      ]}
                      onPress={() => selectCountry(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${item.country} ${item.code}`}
                    >
                      <Text style={styles.flag}>{item.flag}</Text>
                      <View style={styles.countryInfo}>
                        <Text style={[styles.countryName, { color: colors.text }]}>
                          {item.country}
                        </Text>
                        <Text style={[styles.countryIso, { color: colors.textSecondary }]}>
                          {item.iso}
                        </Text>
                      </View>
                      <Text style={[styles.countryCodeList, { color: colors.textSecondary }]}>
                        {item.code}
                      </Text>
                      {selectedCountry.iso === item.iso && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </Pressable>
                  )}
                  contentContainerStyle={styles.listContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                />
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

// Export validation function using libphonenumber
export const validatePhoneForCountry = (phone: string): boolean => {
  if (!phone) return false;
  
  try {
    const phoneNumber = parsePhoneNumberFromString(phone);
    return phoneNumber ? phoneNumber.isValid() : false;
  } catch (error) {
    return false;
  }
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 52,
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    gap: 8,
    minWidth: 100,
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'left',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.7,
  },
  // Search styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  // List styles
  listContainer: {
    paddingBottom: 20,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  countryIso: {
    fontSize: 12,
    fontWeight: '400',
  },
  countryCodeList: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  error: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
});