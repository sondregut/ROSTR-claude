import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { pickImageWithCrop } from '@/lib/photoUpload';
import { Button } from '../buttons/Button';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DateEntry } from '@/contexts/DateContext';

interface EditRosterModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, updates: RosterUpdateData) => void;
  onDelete?: (id: string) => void;
  rosterEntry: DateEntry | null;
}

export interface RosterUpdateData {
  personName: string;
  age?: number;
  occupation?: string;
  howWeMet?: string;
  interests?: string;
  instagram?: string;
  notes?: string;
  photos?: string[];
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

export function EditRosterModal({ 
  visible, 
  onClose, 
  onSave, 
  onDelete,
  rosterEntry 
}: EditRosterModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [formData, setFormData] = useState<RosterUpdateData>({
    personName: '',
    age: undefined,
    occupation: '',
    howWeMet: '',
    interests: '',
    instagram: '',
    notes: '',
    photos: [],
  });

  const [showHowWeMetOptions, setShowHowWeMetOptions] = useState(false);

  // Initialize form data when rosterEntry is provided
  useEffect(() => {
    if (visible && rosterEntry) {
      setFormData({
        personName: rosterEntry.personName,
        age: rosterEntry.rosterInfo?.age,
        occupation: rosterEntry.rosterInfo?.occupation || '',
        howWeMet: rosterEntry.rosterInfo?.howWeMet || '',
        interests: rosterEntry.rosterInfo?.interests || '',
        instagram: rosterEntry.rosterInfo?.instagram || '',
        notes: rosterEntry.notes || '',
        photos: rosterEntry.rosterInfo?.photos || [],
      });
    }
  }, [visible, rosterEntry]);

  const handleChange = (field: keyof RosterUpdateData, value: string | number | string[] | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImagePick = async () => {
    try {
      const result = await pickImageWithCrop('library', {
        aspect: [1, 1], // Square aspect ratio for roster photos
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (result.success && result.uri) {
        handleChange('photos', [...(formData.photos || []), result.uri]);
      } else if (result.error && result.error !== 'Selection cancelled') {
        alert(`Failed to pick image: ${result.error}`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = (formData.photos || []).filter((_, i) => i !== index);
    handleChange('photos', newPhotos);
  };

  const handleSave = () => {
    if (!rosterEntry) return;
    
    onSave(rosterEntry.id, formData);
    onClose();
  };

  const handleDelete = () => {
    if (!rosterEntry || !onDelete) return;
    
    Alert.alert(
      'Delete Roster Entry',
      `Are you sure you want to remove ${rosterEntry.personName} from your roster? This will also remove the feed update.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(rosterEntry.id);
            onClose();
          }
        }
      ]
    );
  };

  const handleClose = () => {
    onClose();
  };

  if (!rosterEntry) return null;

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit Roster Entry
          </Text>
          {onDelete && (
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </Pressable>
          )}
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
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Enter name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.personName}
                  onChangeText={(text) => handleChange('personName', text)}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Age</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.card,
                        borderColor: colors.border
                      }
                    ]}
                    placeholder="Age"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.age ? formData.age.toString() : ''}
                    onChangeText={(text) => handleChange('age', text ? parseInt(text) : undefined)}
                    keyboardType="numeric"
                  />
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
                title="Update"
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
  deleteButton: {
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