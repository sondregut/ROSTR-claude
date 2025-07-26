import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Tag {
  id: string;
  label: string;
  color: string;
}

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

const PREDEFINED_TAGS: Tag[] = [
  { id: 'chemistry', label: 'Chemistry', color: '#FF6B6B' },
  { id: 'great-conversation', label: 'Great Conversation', color: '#4ECDC4' },
  { id: 'romantic', label: 'Romantic', color: '#FF69B4' },
  { id: 'fun', label: 'Fun', color: '#45B7D1' },
  { id: 'awkward', label: 'Awkward', color: '#FFA07A' },
  { id: 'red-flag', label: 'Red Flag', color: '#DC143C' },
  { id: 'boring', label: 'Boring', color: '#708090' },
  { id: 'exciting', label: 'Exciting', color: '#FFD700' },
  { id: 'comfortable', label: 'Comfortable', color: '#98D8C8' },
  { id: 'first-date', label: 'First Date', color: '#9B59B6' },
  { id: 'second-date', label: 'Second Date', color: '#3498DB' },
  { id: 'third-date', label: 'Third Date+', color: '#2ECC71' },
  { id: 'activity-date', label: 'Activity Date', color: '#E67E22' },
  { id: 'dinner-date', label: 'Dinner Date', color: '#E74C3C' },
  { id: 'casual', label: 'Casual', color: '#95A5A6' },
];

export function TagSelector({ selectedTags, onTagsChange, placeholder = 'Select tags' }: TagSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [showModal, setShowModal] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTags, setCustomTags] = useState<Tag[]>([]);
  
  const allTags = [...PREDEFINED_TAGS, ...customTags];
  
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };
  
  const addCustomTag = () => {
    if (customTagInput.trim()) {
      const newTag: Tag = {
        id: `custom-${Date.now()}`,
        label: customTagInput.trim(),
        color: '#7F8C8D', // Default gray for custom tags
      };
      setCustomTags([...customTags, newTag]);
      onTagsChange([...selectedTags, newTag.id]);
      setCustomTagInput('');
    }
  };
  
  const getSelectedTagLabels = () => {
    return selectedTags
      .map(tagId => allTags.find(tag => tag.id === tagId)?.label)
      .filter(Boolean);
  };
  
  const selectedLabels = getSelectedTagLabels();
  
  return (
    <>
      <Pressable
        style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setShowModal(true)}
      >
        {selectedLabels.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedLabels.map((label, index) => (
              <View 
                key={index}
                style={[
                  styles.selectedTag,
                  { 
                    backgroundColor: allTags.find(t => t.label === label)?.color + '20' || '#00000020',
                  }
                ]}
              >
                <Text style={[
                  styles.selectedTagText,
                  { color: allTags.find(t => t.label === label)?.color || colors.text }
                ]}>
                  {label}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            {placeholder}
          </Text>
        )}
        <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
      </Pressable>
      
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Tags</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.tagsGrid}>
              {allTags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: isSelected ? tag.color : colors.card,
                        borderColor: isSelected ? tag.color : colors.border,
                      }
                    ]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        {
                          color: isSelected ? 'white' : colors.text,
                        }
                      ]}
                    >
                      {tag.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </Pressable>
                );
              })}
            </View>
            
            <View style={[styles.customTagSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.customTagTitle, { color: colors.text }]}>Add Custom Tag</Text>
              <View style={styles.customTagInput}>
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Enter custom tag"
                  placeholderTextColor={colors.textSecondary}
                  value={customTagInput}
                  onChangeText={setCustomTagInput}
                  onSubmitEditing={addCustomTag}
                />
                <Pressable
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={addCustomTag}
                >
                  <Ionicons name="add" size={20} color="white" />
                </Pressable>
              </View>
            </View>
          </ScrollView>
          
          <View style={[styles.modalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            </Text>
            <Pressable
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    fontSize: 16,
  },
  selectedTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    gap: 4,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customTagSection: {
    padding: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  customTagTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customTagInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  selectedCount: {
    fontSize: 14,
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});