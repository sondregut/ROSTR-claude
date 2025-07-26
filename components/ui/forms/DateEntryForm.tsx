import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Pressable,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../buttons/Button';
import { PersonSelector } from './PersonSelector';
import { TagSelector } from './TagSelector';
import { CircleSelector } from './CircleSelector';
import { PollCreator } from './PollCreator';
import { Colors } from '../../../constants/Colors';

interface DateEntryFormProps {
  onSubmit: (formData: DateEntryFormData) => void;
  onCancel: () => void;
  initialData?: Partial<DateEntryFormData>;
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
  poll?: {
    question: string;
    options: string[];
  };
  imageUri?: string;
  isPrivate: boolean;
}

export function DateEntryForm({ onSubmit, onCancel, initialData }: DateEntryFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [formData, setFormData] = useState<DateEntryFormData>({
    personId: initialData?.personId || '',
    personName: initialData?.personName || '',
    location: initialData?.location || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    rating: initialData?.rating || 0,
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    circles: initialData?.circles || [],
    poll: initialData?.poll,
    imageUri: initialData?.imageUri || '',
    isPrivate: initialData?.isPrivate ?? false,
  });
  
  // Mock roster data - in real app, this would come from state/database
  const MOCK_ROSTER = [
    { id: '1', name: 'Alex', lastDate: '3 days ago', rating: 4.2 },
    { id: '2', name: 'Jordan', lastDate: '1 week ago', rating: 3.8 },
    { id: '3', name: 'Taylor', lastDate: '2 days ago', rating: 4.5 },
    { id: '4', name: 'Morgan', lastDate: '5 days ago', rating: 2.5 },
  ];

  const [errors, setErrors] = useState<Partial<Record<keyof DateEntryFormData, string>>>({});

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DateEntryFormData, string>> = {};
    
    if (!formData.personId) {
      newErrors.personId = 'Please select a person';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
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
          <Text style={[styles.label, { color: colors.text }]}>Person</Text>
          <PersonSelector
            value={formData.personId}
            onSelect={handlePersonSelect}
            placeholder="Select person"
            error={errors.personId}
            people={MOCK_ROSTER}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: errors.location ? 'red' : colors.border 
              }
            ]}
            placeholder="Enter location"
            placeholderTextColor={colors.textSecondary}
            value={formData.location}
            onChangeText={(text) => handleChange('location', text)}
          />
          {errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Date</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: errors.date ? 'red' : colors.border 
              }
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            value={formData.date}
            onChangeText={(text) => handleChange('date', text)}
          />
          {errors.date && (
            <Text style={styles.errorText}>{errors.date}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Rating</Text>
          {renderRatingPicker()}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[
              styles.textArea, 
              { 
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.border 
              }
            ]}
            placeholder="Enter notes about your date"
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={(text) => handleChange('notes', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
          <TagSelector
            selectedTags={formData.tags}
            onTagsChange={(tags) => handleChange('tags', tags)}
            placeholder="Add tags to describe the date"
          />
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
            selectedCircles={formData.circles}
            onCirclesChange={(circles) => {
              handleChange('circles', circles);
              // If circles are selected, it's not private
              if (circles.length > 0) {
                handleChange('isPrivate', false);
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
            style={styles.button}
          />
          <Button 
            title="Save Date" 
            variant="primary" 
            onPress={handleSubmit} 
            style={styles.button}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  starContainer: {
    marginRight: 8,
    padding: 4,
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
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});
