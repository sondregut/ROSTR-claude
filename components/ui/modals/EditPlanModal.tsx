import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/buttons/Button';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EditPlanModalProps {
  visible: boolean;
  plan: any;
  onClose: () => void;
  onSave: (id: string, updates: Partial<any>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface PlanFormData {
  date: string;
  time?: string;
  location: string;
  content: string;
  tags: string[];
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

export function EditPlanModal({ visible, plan, onClose, onSave, onDelete }: EditPlanModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = useState<PlanFormData>({
    date: '',
    time: '',
    location: '',
    content: '',
    tags: [],
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plan && visible) {
      setFormData({
        date: plan.rawDate || plan.date,
        time: plan.time || '',
        location: plan.location || '',
        content: plan.content || '',
        tags: plan.tags || [],
      });
    }
  }, [plan, visible]);

  const resetForm = () => {
    setFormData({
      date: '',
      time: '',
      location: '',
      content: '',
      tags: [],
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setFormData(prev => ({
        ...prev,
        time: timeString
      }));
    }
  };

  const handleLocationSelect = (location: string) => {
    setFormData(prev => ({ ...prev, location }));
  };

  const handleSubmit = async () => {
    if (!formData.date.trim()) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    setIsSaving(true);
    
    try {
      const updates = {
        rawDate: formData.date,
        time: formData.time,
        location: formData.location,
        content: formData.content,
        tags: formData.tags,
      };

      await onSave(plan.id, updates);
      handleClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Error', 'Failed to save plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(plan.id);
              handleClose();
            } catch (error) {
              console.error('Error deleting plan:', error);
              Alert.alert('Error', 'Failed to delete plan. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (!plan) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={handleClose} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Plan</Text>
            <Pressable onPress={handleDelete} style={styles.headerButton}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Person Name */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Plan with {plan.personName}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
              <Pressable
                style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.dateButtonText, { color: formData.date ? colors.text : colors.textSecondary }]}>
                  {formData.date ? new Date(formData.date).toLocaleDateString() : 'Select date'}
                </Text>
              </Pressable>
            </View>

            {/* Time */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Time (Optional)</Text>
              <Pressable
                style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.dateButtonText, { color: formData.time ? colors.text : colors.textSecondary }]}>
                  {formData.time || 'Select time'}
                </Text>
              </Pressable>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
              <View style={styles.locationGrid}>
                {locationOptions.map((location) => (
                  <Pressable
                    key={location}
                    style={[
                      styles.locationOption,
                      {
                        backgroundColor: formData.location === location ? colors.primary : colors.card,
                        borderColor: formData.location === location ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => handleLocationSelect(location)}
                  >
                    <Text
                      style={[
                        styles.locationOptionText,
                        { color: formData.location === location ? 'white' : colors.text }
                      ]}
                    >
                      {location}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Notes/Content */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                value={formData.content}
                onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
                placeholder="Add any additional details about your plan..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title={isSaving ? "Saving..." : "Save Changes"}
              variant="primary"
              onPress={handleSubmit}
              disabled={isSaving || !formData.date.trim() || !formData.location.trim()}
              style={styles.saveButton}
            />
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.date ? new Date(formData.date) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
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
    minWidth: 60,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  locationOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    marginTop: 0,
  },
});