import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DateEntry } from '@/contexts/DateContext';
import { Button } from '../buttons/Button';
import { TagSelector } from '../forms/TagSelector';
import { CircleSelector } from '../forms/CircleSelector';
import { PollCreator } from '../forms/PollCreator';
import { pickImageWithCrop } from '@/lib/photoUpload';

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

interface EditDateModalProps {
  visible: boolean;
  date: DateEntry | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<DateEntry>) => void;
  onDelete?: (id: string) => void;
}

export function EditDateModal({ visible, date, onClose, onSave, onDelete }: EditDateModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [editedData, setEditedData] = useState({
    location: '',
    rating: 0,
    notes: '',
    tags: [] as string[],
    circles: [] as string[],
    instagramUsername: '',
    poll: undefined as { question: string; options: string[] } | undefined,
    imageUri: '',
    isPrivate: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (date) {
      setEditedData({
        location: date.location || '',
        rating: date.rating || 0,
        notes: date.notes || '',
        tags: date.tags || [],
        circles: date.sharedCircles || [],
        instagramUsername: date.instagramUsername || '',
        poll: date.poll,
        imageUri: date.imageUri || '',
        isPrivate: date.isPrivate || false,
      });
    }
  }, [date]);

  const handleChange = (field: keyof typeof editedData, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRatingChange = (newRating: number) => {
    handleChange('rating', newRating);
  };

  const handleImagePick = async () => {
    try {
      const result = await pickImageWithCrop('library', {
        aspect: [4, 3],
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (result.success && result.uri) {
        handleChange('imageUri', result.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const handleSave = async () => {
    if (!date) return;
    
    setIsSubmitting(true);
    try {
      await onSave(date.id, {
        location: editedData.location,
        rating: editedData.rating,
        notes: editedData.notes,
        tags: editedData.tags,
        sharedCircles: editedData.circles,
        instagramUsername: editedData.instagramUsername,
        poll: editedData.poll,
        imageUri: editedData.imageUri,
        isPrivate: editedData.isPrivate,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = () => {
    if (!date || !onDelete) return;
    
    Alert.alert(
      'Delete Date',
      'Are you sure you want to delete this date update?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete(date.id);
            onClose();
          }
        }
      ]
    );
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
            name={i <= editedData.rating ? 'star' : 'star-outline'}
            size={32}
            color={i <= editedData.rating ? '#FFD700' : colors.text}
          />
        </Pressable>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };
  
  if (!date) return null;
  
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.title, { color: colors.text }]}>Edit Date</Text>
            <Pressable onPress={handleSave} style={styles.headerButton} disabled={isSubmitting}>
              <Text style={[styles.saveButton, { color: isSubmitting ? colors.textSecondary : colors.primary }]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
          
          <ScrollView 
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Date Info */}
            <View style={[styles.dateInfo, { backgroundColor: colors.card }]}>
              <Text style={[styles.dateInfoText, { color: colors.text }]}>
                Date with {date.personName}
              </Text>
              <Text style={[styles.dateInfoSubtext, { color: colors.textSecondary }]}>
                {date.date}
              </Text>
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
                  value={editedData.location}
                  onChangeText={(text) => handleChange('location', text)}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Rate your date
              </Text>
              <View style={styles.ratingSection}>
                {renderRatingPicker()}
                {editedData.rating > 0 && (
                  <Text style={[styles.ratingText, { color: colors.text }]}>
                    {editedData.rating}/5
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Date details
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
                value={editedData.notes}
                onChangeText={(text) => handleChange('notes', text)}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Add tags</Text>
              <View style={styles.tagsGrid}>
                {PREDEFINED_TAGS.map(tag => {
                  const isSelected = editedData.tags.includes(tag.id);
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
                          handleChange('tags', editedData.tags.filter(id => id !== tag.id));
                        } else {
                          handleChange('tags', [...editedData.tags, tag.id]);
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
                title="Change Photo"
                variant="outline"
                onPress={handleImagePick}
                leftIcon={<Ionicons name="image-outline" size={20} color={colors.primary} />}
              />
              {editedData.imageUri && (
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
                selectedCircles={editedData.isPrivate ? [] : editedData.circles}
                onCirclesChange={(circles) => {
                  handleChange('circles', circles);
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
                poll={editedData.poll}
                onPollChange={(poll) => handleChange('poll', poll)}
              />
            </View>
            
            {/* Delete Button */}
            {onDelete && (
              <View style={styles.deleteSection}>
                <Pressable
                  style={[styles.deleteButton, { borderColor: colors.error }]}
                  onPress={handleDelete}
                  disabled={isSubmitting}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                    Delete Date Update
                  </Text>
                </Pressable>
              </View>
            )}
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
    padding: 4,
    minWidth: 60,
  },
  cancelButton: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  dateInfo: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  dateInfoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateInfoSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
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
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
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
  deleteSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});