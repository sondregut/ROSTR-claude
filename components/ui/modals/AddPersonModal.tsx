import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { pickImageWithCrop } from '@/lib/photoUpload';
import { Button } from '../buttons/Button';
import { CircleSelector } from '../forms/CircleSelector';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { validateName, validateAge, validateTextLength, validateInstagram, sanitizeInput } from '@/utils/validation';

interface AddPersonModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (person: PersonData) => void;
  initialData?: PersonData;
}

export interface PersonData {
  name: string;
  age?: string;
  occupation?: string;
  location?: string;
  howWeMet?: string;
  interests?: string;
  instagram?: string;
  notes?: string;
  photos?: string[];
  circles?: string[];
  isPrivate?: boolean;
}

const HOW_WE_MET_OPTIONS = [
  'Dating App',
  'Through Friends',
  'At Work',
  'Social Event',
  'Bar/Club',
  'Online',
  'Other',
];

export function AddPersonModal({ visible, onClose, onSave, initialData }: AddPersonModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [formData, setFormData] = useState<PersonData>({
    name: '',
    age: '',
    occupation: '',
    location: '',
    howWeMet: '',
    interests: '',
    instagram: '',
    notes: '',
    photos: [],
    circles: [],
    isPrivate: false,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof PersonData, string>>>({});
  const [showHowWeMetOptions, setShowHowWeMetOptions] = useState(false);
  
  // Removed debouncing to fix performance issues
  
  // Stable styles without color dependencies
  const inputStyle = useMemo(() => styles.input, []);
  const textAreaStyle = useMemo(() => styles.textArea, []);
  
  // Dynamic color styles (not memoized to avoid stale closures)
  const inputColorStyle = {
    color: colors.text,
    backgroundColor: colors.card,
    borderColor: colors.border
  };
  
  const textAreaColorStyle = {
    color: colors.text,
    backgroundColor: colors.card,
    borderColor: colors.border
  };

  // Initialize form data when initialData is provided (for editing)
  useEffect(() => {
    if (visible && initialData) {
      setFormData(initialData);
    } else if (visible && !initialData) {
      // Reset form for new person
      resetForm();
    }
  }, [visible, initialData]);
  
  // No cleanup needed since we removed debounce timers

  // Simple change handler without circular dependencies
  const handleChange = useCallback((field: keyof PersonData, value: string | string[]) => {
    // Update state immediately for responsive UI
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []); // No dependencies to prevent recreating on every render

  const handleImagePick = async () => {
    try {
      const result = await pickImageWithCrop('library', {
        aspect: [1, 1], // Square aspect ratio for profile photos
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (result.success && result.uri) {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), result.uri]
        }));
      } else if (result.error && result.error !== 'Selection cancelled') {
        alert(`Failed to pick image: ${result.error}`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;
    
    // Name is required
    if (!formData.name) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else {
      const nameResult = validateName(formData.name);
      if (!nameResult.isValid) {
        newErrors.name = nameResult.error;
        isValid = false;
      }
    }
    
    // Validate age if provided
    if (formData.age) {
      const ageResult = validateAge(formData.age);
      if (!ageResult.isValid) {
        newErrors.age = ageResult.error;
        isValid = false;
      }
    }
    
    // Validate Instagram username if provided
    if (formData.instagram) {
      const instagramResult = validateInstagram(formData.instagram);
      if (!instagramResult.isValid) {
        newErrors.instagram = instagramResult.error;
        isValid = false;
      }
    }
    
    // Validate other text fields for length
    if (formData.occupation) {
      const occupationResult = validateTextLength(formData.occupation, 0, 50, 'Occupation');
      if (!occupationResult.isValid) {
        newErrors.occupation = occupationResult.error;
        isValid = false;
      }
    }
    
    if (formData.location) {
      const locationResult = validateTextLength(formData.location, 0, 50, 'Location');
      if (!locationResult.isValid) {
        newErrors.location = locationResult.error;
        isValid = false;
      }
    }
    
    if (formData.interests) {
      const interestsResult = validateTextLength(formData.interests, 0, 200, 'Interests');
      if (!interestsResult.isValid) {
        newErrors.interests = interestsResult.error;
        isValid = false;
      }
    }
    
    if (formData.notes) {
      const notesResult = validateTextLength(formData.notes, 0, 500, 'Notes');
      if (!notesResult.isValid) {
        newErrors.notes = notesResult.error;
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  }, [formData]);
  
  // Validate individual field on blur without circular dependency
  const validateField = useCallback((field: keyof PersonData) => {
    setFormData(currentData => {
      // Use current form data from state
      setErrors(currentErrors => {
        const newErrors = { ...currentErrors };
        
        switch (field) {
          case 'name':
            if (!currentData.name) {
              newErrors.name = 'Name is required';
            } else {
              const nameResult = validateName(currentData.name);
              if (!nameResult.isValid) {
                newErrors.name = nameResult.error;
              } else {
                delete newErrors.name;
              }
            }
            break;
          case 'age':
            if (currentData.age) {
              const ageResult = validateAge(currentData.age);
              if (!ageResult.isValid) {
                newErrors.age = ageResult.error;
              } else {
                delete newErrors.age;
              }
            } else {
              delete newErrors.age;
            }
            break;
          case 'instagram':
            if (currentData.instagram) {
              const instagramResult = validateInstagram(currentData.instagram);
              if (!instagramResult.isValid) {
                newErrors.instagram = instagramResult.error;
              } else {
                delete newErrors.instagram;
              }
            } else {
              delete newErrors.instagram;
            }
            break;
        }
        
        return newErrors;
      });
      
      return currentData; // Don't change form data
    });
  }, []); // No dependencies

  const handleSave = useCallback(() => {
    
    if (validateForm()) {
      // Sanitize text fields before saving
      const sanitizedData: PersonData = {
        ...formData,
        name: sanitizeInput(formData.name),
        occupation: formData.occupation ? sanitizeInput(formData.occupation) : formData.occupation,
        location: formData.location ? sanitizeInput(formData.location) : formData.location,
        howWeMet: formData.howWeMet ? sanitizeInput(formData.howWeMet) : formData.howWeMet,
        interests: formData.interests ? sanitizeInput(formData.interests) : formData.interests,
        notes: formData.notes ? sanitizeInput(formData.notes) : formData.notes,
        instagram: formData.instagram ? validateInstagram(formData.instagram).sanitized || formData.instagram : formData.instagram,
      };
      
      onSave(sanitizedData);
      resetForm();
      onClose();
    }
  }, [validateForm, formData, onSave, onClose]);

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      occupation: '',
      location: '',
      howWeMet: '',
      interests: '',
      instagram: '',
      notes: '',
      photos: [],
      circles: [],
      isPrivate: false,
    });
    // No errors to reset
  };

  const handleClose = useCallback(() => {
    
    resetForm();
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {initialData ? 'Edit Person' : 'Add New Person'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photoContainer}>
                  {(formData.photos || []).map((photo, index) => (
                    <View key={index} style={styles.photoWrapper}>
                      <Image 
                        source={{ uri: photo }} 
                        style={[styles.photoImage, { backgroundColor: colors.card }]}
                        onError={(e) => {
                          console.log('[AddPersonModal] Image failed to load:', photo);
                          console.log('[AddPersonModal] Error details:', e.nativeEvent.error);
                        }}
                      />
                      <Pressable
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="red" />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable 
                    style={[styles.addPhotoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={handleImagePick}
                  >
                    <Ionicons name="camera-outline" size={32} color={colors.text} />
                  </Pressable>
                </View>
              </ScrollView>
            </View>

            {/* Basic Info */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                <TextInput
                  style={[inputStyle, inputColorStyle]}
                  placeholder="Enter name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                  onBlur={() => validateField('name')}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Age</Text>
                  <TextInput
                    style={[inputStyle, inputColorStyle]}
                    placeholder="Age"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.age}
                    onChangeText={(text) => handleChange('age', text)}
                    onBlur={() => validateField('age')}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 2 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Occupation</Text>
                  <TextInput
                    style={[inputStyle, inputColorStyle]}
                    placeholder="Job title"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.occupation}
                    onChangeText={(text) => handleChange('occupation', text)}
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Location</Text>
                <TextInput
                  style={[inputStyle, inputColorStyle]}
                  placeholder="City or neighborhood"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.location}
                  onChangeText={(text) => handleChange('location', text)}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>How We Met</Text>
                <Pressable
                  style={[
                    styles.input,
                    styles.selectInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setShowHowWeMetOptions(!showHowWeMetOptions)}
                >
                  <Text style={[
                    { color: formData.howWeMet ? colors.text : colors.textSecondary }
                  ]}>
                    {formData.howWeMet || 'Select an option'}
                  </Text>
                  <Ionicons 
                    name={showHowWeMetOptions ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={colors.text} 
                  />
                </Pressable>
                
                {showHowWeMetOptions && (
                  <View style={[styles.optionsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {HOW_WE_MET_OPTIONS.map(option => (
                      <Pressable
                        key={option}
                        style={[styles.option, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          handleChange('howWeMet', option);
                          setShowHowWeMetOptions(false);
                        }}
                      >
                        <Text style={{ color: colors.text }}>{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Additional Info */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Info</Text>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Interests</Text>
                <TextInput
                  style={[textAreaStyle, textAreaColorStyle]}
                  placeholder="Hobbies, interests, things they like..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.interests}
                  onChangeText={(text) => handleChange('interests', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Instagram</Text>
                <TextInput
                  style={[inputStyle, inputColorStyle]}
                  placeholder="@username"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.instagram}
                  onChangeText={(text) => handleChange('instagram', text)}
                  onBlur={() => validateField('instagram')}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
                <TextInput
                  style={[textAreaStyle, textAreaColorStyle]}
                  placeholder="Any additional notes..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.notes}
                  onChangeText={(text) => handleChange('notes', text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Sharing Options */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Share With</Text>
              
              <View style={styles.formGroup}>
                <CircleSelector
                  selectedCircles={formData.isPrivate ? [] : formData.circles || []}
                  onCirclesChange={(circles) => {
                    setFormData(prev => ({
                      ...prev,
                      circles: circles,
                      isPrivate: circles.length === 0
                    }));
                  }}
                  showPrivateOption={true}
                />
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleClose}
                style={styles.button}
              />
              <Button
                title={initialData ? "Update Person" : "Save Person"}
                variant="primary"
                onPress={handleSave}
                style={styles.button}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  photoSection: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionsList: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});