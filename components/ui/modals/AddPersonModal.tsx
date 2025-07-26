import React, { useState } from 'react';
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
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../buttons/Button';
import { Colors } from '../../../constants/Colors';

interface AddPersonModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (person: PersonData) => void;
}

export interface PersonData {
  name: string;
  age: string;
  occupation: string;
  location: string;
  howWeMet: string;
  interests: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  photos: string[];
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

export function AddPersonModal({ visible, onClose, onSave }: AddPersonModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [formData, setFormData] = useState<PersonData>({
    name: '',
    age: '',
    occupation: '',
    location: '',
    howWeMet: '',
    interests: '',
    phone: '',
    instagram: '',
    notes: '',
    photos: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PersonData, string>>>({});
  const [showHowWeMetOptions, setShowHowWeMetOptions] = useState(false);

  const handleChange = (field: keyof PersonData, value: string | string[]) => {
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

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      handleChange('photos', [...formData.photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    handleChange('photos', newPhotos);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PersonData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 18) {
      newErrors.age = 'Please enter a valid age (18+)';
    }
    
    if (!formData.howWeMet.trim()) {
      newErrors.howWeMet = 'Please select how you met';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      occupation: '',
      location: '',
      howWeMet: '',
      interests: '',
      phone: '',
      instagram: '',
      notes: '',
      photos: [],
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Person</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photoContainer}>
                  {formData.photos.map((photo, index) => (
                    <View key={index} style={styles.photoWrapper}>
                      <View style={[styles.photoPlaceholder, { backgroundColor: colors.card }]}>
                        <Text style={{ color: colors.text }}>Photo {index + 1}</Text>
                      </View>
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
                <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: errors.name ? 'red' : colors.border
                    }
                  ]}
                  placeholder="Enter name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Age *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.card,
                        borderColor: errors.age ? 'red' : colors.border
                      }
                    ]}
                    placeholder="Age"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.age}
                    onChangeText={(text) => handleChange('age', text)}
                    keyboardType="numeric"
                  />
                  {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
                </View>

                <View style={[styles.formGroup, { flex: 2 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Occupation</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.card,
                        borderColor: colors.border
                      }
                    ]}
                    placeholder="Job title"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.occupation}
                    onChangeText={(text) => handleChange('occupation', text)}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Location</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="City or neighborhood"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.location}
                  onChangeText={(text) => handleChange('location', text)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>How We Met *</Text>
                <Pressable
                  style={[
                    styles.input,
                    styles.selectInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: errors.howWeMet ? 'red' : colors.border
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
                {errors.howWeMet && <Text style={styles.errorText}>{errors.howWeMet}</Text>}
                
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
                  style={[
                    styles.textArea,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Hobbies, interests, things they like..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.interests}
                  onChangeText={(text) => handleChange('interests', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Instagram</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="@username"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.instagram}
                  onChangeText={(text) => handleChange('instagram', text)}
                  autoCapitalize="none"
                />
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
                  placeholder="Any additional notes..."
                  placeholderTextColor={colors.textSecondary}
                  value={formData.notes}
                  onChangeText={(text) => handleChange('notes', text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
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
                title="Save Person"
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
    paddingBottom: 32,
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
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