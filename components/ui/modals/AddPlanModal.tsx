import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/buttons/Button';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (planData: PlanFormData) => void;
  personName: string;
}

export interface PlanFormData {
  date: string;
  location: string;
  customLocation: string;
  content: string;
}

const locationOptions = [
  'Restaurant',
  'Cafe', 
  'Bar',
  'Walk/Park',
  'Movies',
  'Activity',
  'Home',
  'Other'
];

export function AddPlanModal({ visible, onClose, onSubmit, personName }: AddPlanModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = useState<PlanFormData>({
    date: '',
    location: '',
    customLocation: '',
    content: '',
  });

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form validation
  const isValidDate = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Get today's date in YYYY-MM-DD format for example
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    if (!isValidDate(dateString)) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      location: '',
      customLocation: '',
      content: '',
    });
    setShowLocationDropdown(false);
    setSelectedDate(new Date());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(formData);
    resetForm();
    onClose();
  };

  const updateFormData = (field: keyof PlanFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectLocation = (location: string) => {
    updateFormData('location', location);
    setShowLocationDropdown(false);
    
    // Clear custom location if not "Other"
    if (location !== 'Other') {
      updateFormData('customLocation', '');
    }
  };

  const canSubmit = formData.date.trim();

  const remainingChars = 300 - formData.content.length;

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={handleClose} style={styles.headerButton}>
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Plan Date with {personName}
            </Text>
            
            <Pressable 
              onPress={handleSubmit} 
              style={[
                styles.headerButton,
                styles.submitButton,
                { 
                  backgroundColor: canSubmit ? colors.primary : colors.border,
                  opacity: canSubmit ? 1 : 0.6
                }
              ]}
              disabled={!canSubmit}
            >
              <Text style={[styles.submitText, { color: canSubmit ? 'white' : colors.textSecondary }]}>
                Plan Date
              </Text>
            </Pressable>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100 }}
          >
          {/* Date Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>When</Text>
            
            {/* Date Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Date <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <Pressable
                style={[styles.datePickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.datePickerText, { color: formData.date ? colors.text : colors.textSecondary }]}>
                  {formData.date ? formatDateDisplay(formData.date) : 'Select date'}
                </Text>
              </Pressable>
              
              {showDatePicker && (
                <View style={Platform.OS === 'ios' ? [styles.datePickerContainer, { backgroundColor: colors.card }] : undefined}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                    textColor={colors.text}
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (date) {
                        setSelectedDate(date);
                        updateFormData('date', date.toISOString().split('T')[0]);
                      }
                    }}
                  />
                </View>
              )}
              
              {Platform.OS === 'ios' && showDatePicker && (
                <Button
                  title="Done"
                  variant="primary"
                  onPress={() => setShowDatePicker(false)}
                  style={{ marginTop: 12 }}
                />
              )}
            </View>
          </View>

          {/* Location Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Where</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Location
              </Text>
              
              <Pressable 
                style={[styles.dropdownButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowLocationDropdown(!showLocationDropdown)}
              >
                <Text style={[styles.dropdownText, { color: formData.location ? colors.text : colors.textSecondary }]}>
                  {formData.location || 'Select location type'}
                </Text>
                <Ionicons 
                  name={showLocationDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </Pressable>

              {showLocationDropdown && (
                <ScrollView 
                  style={[styles.dropdownList, { backgroundColor: colors.background, borderColor: colors.border }]}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {locationOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.dropdownItem,
                        { backgroundColor: formData.location === option ? colors.primary + '20' : 'transparent' }
                      ]}
                      onPress={() => selectLocation(option)}
                    >
                      <Text style={[styles.dropdownItemText, { 
                        color: formData.location === option ? colors.primary : colors.text 
                      }]}>
                        {option}
                      </Text>
                      {formData.location === option && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Custom Location Input */}
            {formData.location === 'Other' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Custom Location <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter specific location"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.customLocation}
                  onChangeText={(value) => updateFormData('customLocation', value)}
                />
              </View>
            )}
          </View>

          {/* Plan Details Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                What are you planning?
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="What are you planning to do? Any special details or things you're looking forward to..."
                placeholderTextColor={colors.textSecondary}
                value={formData.content}
                onChangeText={(value) => updateFormData('content', value)}
                multiline
                numberOfLines={4}
                maxLength={300}
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
                scrollEnabled={true}
              />
              <Text style={[styles.charCounter, { color: remainingChars < 50 ? colors.error : colors.textSecondary }]}>
                {remainingChars} characters remaining
              </Text>
            </View>
          </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  charCounter: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
  },
  datePickerContainer: {
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 8,
    overflow: 'hidden',
  },
});