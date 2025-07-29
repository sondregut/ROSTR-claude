import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../buttons/Button';
import { PersonSelector } from './PersonSelector';
import { TagSelector } from './TagSelector';
import { CircleSelector } from './CircleSelector';
import { PollCreator } from './PollCreator';
import { AddPersonModal, PersonData } from '../modals/AddPersonModal';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRoster } from '@/contexts/RosterContext';

const PREDEFINED_TAGS = [
  { id: 'first-date', label: 'First Date', color: '#9B59B6' },
  { id: 'second-date', label: 'Second Date', color: '#3498DB' },
  { id: 'third-date', label: 'Third Date', color: '#2ECC71' },
  { id: 'chemistry', label: 'Chemistry', color: '#FF6B6B' },
  { id: 'great-conversation', label: 'Great Conversation', color: '#4ECDC4' },
  { id: 'awkward', label: 'Awkward', color: '#FFA07A' },
  { id: 'red-flag', label: 'Red Flag', color: '#DC143C' },
  { id: 'potential', label: 'Potential', color: '#F39C12' },
  { id: 'funny', label: 'Funny', color: '#FFD700' },
  { id: 'romantic', label: 'Romantic', color: '#FF69B4' },
  { id: 'activity-date', label: 'Activity Date', color: '#E67E22' },
  { id: 'dinner-date', label: 'Dinner Date', color: '#E74C3C' },
  { id: 'coffee-date', label: 'Coffee Date', color: '#95A5A6' },
  { id: 'other', label: 'Other +', color: '#7F8C8D' },
];

interface DateEntryFormProps {
  onSubmit: (formData: DateEntryFormData) => void;
  onCancel: () => void;
  initialData?: Partial<DateEntryFormData>;
  isSubmitting?: boolean;
}

export interface DateEntryFormData {
  personId: string;
  personName: string;
  location: string;
  date: string;
  rating: number;
  notes: string;
  tags: string[];
  circles: string[];
  instagramUsername?: string;
  poll?: {
    question: string;
    options: string[];
  };
  imageUri?: string;
  isPrivate: boolean;
}

export function DateEntryForm({ onSubmit, onCancel, initialData, isSubmitting = false }: DateEntryFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { activeRoster, pastConnections, addPerson } = useRoster();
  
  const [formData, setFormData] = useState<DateEntryFormData>({
    personId: initialData?.personId || '',
    personName: initialData?.personName || '',
    location: initialData?.location || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    rating: initialData?.rating || 0,
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    circles: initialData?.circles || [],
    instagramUsername: initialData?.instagramUsername || '',
    poll: initialData?.poll,
    imageUri: initialData?.imageUri || '',
    isPrivate: initialData?.isPrivate ?? false,
  });
  
  // Get roster data from context (combine active and past connections)
  const roster = [...activeRoster, ...pastConnections];

  const [errors, setErrors] = useState<Partial<Record<keyof DateEntryFormData, string>>>({});
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  const handleChange = (field: keyof DateEntryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleRatingChange = (newRating: number) => {
    handleChange('rating', newRating);
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      handleChange('imageUri', result.assets[0].uri);
    }
  };

  const handlePersonSelect = (personId: string, personName: string) => {
    setFormData(prev => ({
      ...prev,
      personId,
      personName
    }));
    
    // Clear error when user selects
    if (errors.personId) {
      setErrors(prev => ({
        ...prev,
        personId: undefined
      }));
    }
  };

  const handleAddNewPerson = async (newPerson: PersonData) => {
    try {
      // Add the person to the roster using the context method
      await addPerson(newPerson.name, newPerson);
      setShowAddPersonModal(false);
      
      // Find the newly added person from the roster (it will be the most recent)
      // In a real app, addPerson should return the new person's ID
      const updatedRoster = [...activeRoster, ...pastConnections];
      const newestPerson = updatedRoster.find(p => p.name === newPerson.name);
      
      if (newestPerson) {
        // Auto-select the new person
        handlePersonSelect(newestPerson.id, newestPerson.name);
      }
    } catch (error) {
      console.error('Error adding new person:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DateEntryFormData, string>> = {};
    
    if (!formData.personId) {
      newErrors.personId = 'Please select a person';
    }
    
    if (!formData.rating || formData.rating === 0) {
      newErrors.rating = 'Please rate your date';
    }
    
    if (!formData.notes.trim()) {
      newErrors.notes = 'Please add some details about your date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Pressable
          key={i}
          onPress={() => handleRatingChange(i)}
          style={styles.starContainer}
          accessibilityLabel={`Rate ${i} stars`}
          accessibilityRole="button"
        >
          <Ionicons
            name={i <= formData.rating ? 'star' : 'star-outline'}
            size={32}
            color={i <= formData.rating ? '#FFD700' : colors.text}
          />
        </Pressable>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Who was your date with? <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <PersonSelector
            value={formData.personId}
            onSelect={handlePersonSelect}
            placeholder="Select person"
            error={errors.personId}
            people={roster}
            onAddNew={() => setShowAddPersonModal(true)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Where did you go?</Text>
          <View style={styles.locationContainer}>
            <Ionicons 
              name="location-outline" 
              size={20} 
              color={colors.textSecondary}
              style={styles.locationIcon}
            />
            <TextInput
              style={[
                styles.locationInput,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border
                }
              ]}
              placeholder="Restaurant, park, coffee shop..."
              placeholderTextColor={colors.textSecondary}
              value={formData.location}
              onChangeText={(text) => handleChange('location', text)}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Rate your date <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={styles.ratingSection}>
            {renderRatingPicker()}
            {formData.rating > 0 && (
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {formData.rating}/5
              </Text>
            )}
          </View>
          {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Date details <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.textArea, 
              { 
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.border 
              }
            ]}
            placeholder="How was your date? Share the highlights, lowlights, and everything in between..."
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={(text) => handleChange('notes', text)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
        </View>


        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Add tags</Text>
          <View style={styles.tagsGrid}>
            {PREDEFINED_TAGS.map(tag => {
              const isSelected = formData.tags.includes(tag.id);
              return (
                <Pressable
                  key={tag.id}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: isSelected ? tag.color + '20' : colors.card,
                      borderColor: isSelected ? tag.color : colors.border,
                    }
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      handleChange('tags', formData.tags.filter(id => id !== tag.id));
                    } else {
                      handleChange('tags', [...formData.tags, tag.id]);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      {
                        color: isSelected ? tag.color : colors.text,
                      }
                    ]}
                  >
                    {tag.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Button
            title="Add Photo"
            variant="outline"
            onPress={handleImagePick}
            leftIcon={<Ionicons name="image-outline" size={20} color={colors.primary} />}
          />
          {formData.imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Text style={[styles.imagePreviewText, { color: colors.text }]}>
                Image selected
              </Text>
              <Pressable 
                onPress={() => handleChange('imageUri', '')}
                accessibilityLabel="Remove image"
                accessibilityRole="button"
              >
                <Ionicons name="close-circle" size={20} color={colors.text} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Share With</Text>
          <CircleSelector
            selectedCircles={formData.isPrivate ? [] : formData.circles}
            onCirclesChange={(circles) => {
              handleChange('circles', circles);
              // If circles are selected, it's not private
              if (circles.length > 0) {
                handleChange('isPrivate', false);
              } else {
                handleChange('isPrivate', true);
              }
            }}
            showPrivateOption={true}
          />
        </View>

        <View style={styles.formGroup}>
          <PollCreator
            poll={formData.poll}
            onPollChange={(poll) => handleChange('poll', poll)}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <Button 
            title="Cancel" 
            variant="outline" 
            onPress={onCancel} 
            style={[styles.button, styles.cancelButton]}
            disabled={isSubmitting}
          />
          <Button 
            title={isSubmitting ? "Saving..." : (formData.isPrivate ? "Save Private Update" : "Post Update")} 
            variant="primary" 
            onPress={handleSubmit} 
            style={[styles.button, styles.shareButton]}
            disabled={isSubmitting || !formData.personId || !formData.rating || !formData.notes.trim()}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      
      <AddPersonModal
        visible={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        onSave={handleAddNewPerson}
      />
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  starContainer: {
    marginRight: 8,
    padding: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  imagePreviewText: {
    fontSize: 14,
  },
  privacyContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    flex: 0.4,
  },
  shareButton: {
    flex: 0.6,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  locationIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  locationInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 40,
    fontSize: 16,
  },
});
