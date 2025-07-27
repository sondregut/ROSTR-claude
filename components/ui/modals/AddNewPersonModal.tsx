import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  useColorScheme,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';

interface AddNewPersonModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (person: NewPersonData) => void;
}

export interface NewPersonData {
  name: string;
  age?: string;
  location?: string;
  occupation?: string;
  howWeMet?: string;
  interests: string[];
  notes?: string;
  avatarUri?: string;
}

const HOW_WE_MET_OPTIONS = [
  'Dating App (generic)',
  'Tinder',
  'Hinge',
  'Bumble',
  'Through Friends',
  'Work/Professional',
  'Bar/Club',
  'Coffee Shop',
  'Gym',
  'Event/Party',
  'Other',
];

const INTERESTS_OPTIONS = [
  'Coffee',
  'Hiking',
  'Photography',
  'Cooking',
  'Travel',
  'Art',
  'Music',
  'Fitness',
  'Reading',
  'Movies',
  'Wine',
  'Dancing',
];

export function AddNewPersonModal({ visible, onClose, onAdd }: AddNewPersonModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = useState<NewPersonData>({
    name: '',
    age: '',
    location: '',
    occupation: '',
    howWeMet: '',
    interests: [],
    notes: '',
    avatarUri: '',
  });

  const [showHowWeMetDropdown, setShowHowWeMetDropdown] = useState(false);

  const handleChange = (field: keyof NewPersonData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add a photo.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      handleChange('avatarUri', result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this person.');
      return;
    }

    onAdd(formData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      location: '',
      occupation: '',
      howWeMet: '',
      interests: [],
      notes: '',
      avatarUri: '',
    });
    setShowHowWeMetDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getAvatarDisplay = () => {
    if (formData.avatarUri) {
      return <Image source={{ uri: formData.avatarUri }} style={styles.avatarImage} />;
    } else if (formData.name) {
      return (
        <Text style={[styles.avatarInitial, { color: colors.buttonText }]}>
          {formData.name.charAt(0).toUpperCase()}
        </Text>
      );
    } else {
      return <Ionicons name="person" size={40} color={colors.textSecondary} />;
    }
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
          <Pressable onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Person</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Pressable
              style={[styles.avatarContainer, { backgroundColor: colors.primary }]}
              onPress={handleImagePick}
            >
              {getAvatarDisplay()}
              <Pressable
                style={[styles.cameraButton, { backgroundColor: colors.background }]}
                onPress={handleImagePick}
              >
                <Ionicons name="camera" size={20} color={colors.primary} />
              </Pressable>
            </Pressable>
          </View>

          {/* Basic Information */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              placeholder="Enter their name"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
            />
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Age</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="28"
                placeholderTextColor={colors.textSecondary}
                value={formData.age}
                onChangeText={(text) => handleChange('age', text)}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Location</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="New York, NY"
                placeholderTextColor={colors.textSecondary}
                value={formData.location}
                onChangeText={(text) => handleChange('location', text)}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Occupation</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              placeholder="Software Engineer"
              placeholderTextColor={colors.textSecondary}
              value={formData.occupation}
              onChangeText={(text) => handleChange('occupation', text)}
            />
          </View>

          {/* Meeting Context */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>How did you meet?</Text>
            <Pressable
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowHowWeMetDropdown(!showHowWeMetDropdown)}
            >
              <Text style={[styles.dropdownText, { color: formData.howWeMet ? colors.text : colors.textSecondary }]}>
                {formData.howWeMet || 'Select an option'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </Pressable>

            {showHowWeMetDropdown && (
              <View style={[styles.dropdownOptions, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {HOW_WE_MET_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.dropdownOption, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        handleChange('howWeMet', option);
                        setShowHowWeMetDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownOptionText, { color: colors.text }]}>{option}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Interests */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Interests (Optional)</Text>
            <View style={styles.interestsGrid}>
              {INTERESTS_OPTIONS.map((interest) => (
                <Pressable
                  key={interest}
                  style={[
                    styles.interestChip,
                    {
                      backgroundColor: formData.interests.includes(interest)
                        ? colors.primary + '20'
                        : colors.card,
                      borderColor: formData.interests.includes(interest)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => handleInterestToggle(interest)}
                >
                  <Text
                    style={[
                      styles.interestText,
                      { color: formData.interests.includes(interest) ? colors.primary : colors.text },
                    ]}
                  >
                    {interest}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              placeholder="Any first impressions or notes about them..."
              placeholderTextColor={colors.textSecondary}
              value={formData.notes}
              onChangeText={(text) => handleChange('notes', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
            onPress={handleClose}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.button,
              styles.addButton,
              { 
                backgroundColor: formData.name.trim() ? colors.primary : colors.border,
                opacity: formData.name.trim() ? 1 : 0.5,
              },
            ]}
            onPress={handleSubmit}
            disabled={!formData.name.trim()}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Add Person</Text>
          </Pressable>
        </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '600',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  formGroup: {
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  dropdown: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 1000,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  addButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});