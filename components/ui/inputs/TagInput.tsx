import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TagInputProps {
  label?: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

export function TagInput({
  label,
  tags,
  onTagsChange,
  placeholder = 'Add a tag',
  maxTags,
  suggestions = [],
}: TagInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      (!maxTags || tags.length < maxTags)
    ) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleInputSubmit = () => {
    handleAddTag(inputValue);
  };

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion)
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      
      <View style={[styles.tagsContainer, { backgroundColor: colors.card }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsScroll}
        >
          {tags.map((tag, index) => (
            <View
              key={index}
              style={[styles.tag, { backgroundColor: colors.primary + '20' }]}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {tag}
              </Text>
              <Pressable
                onPress={() => handleRemoveTag(index)}
                style={styles.removeButton}
              >
                <Ionicons name="close" size={16} color={colors.primary} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.inputContainer, { borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text);
            setShowSuggestions(text.length > 0);
          }}
          onSubmitEditing={handleInputSubmit}
          placeholder={
            maxTags && tags.length >= maxTags
              ? `Maximum ${maxTags} tags`
              : placeholder
          }
          placeholderTextColor={colors.textSecondary}
          editable={!maxTags || tags.length < maxTags}
        />
        {inputValue.length > 0 && (
          <Pressable
            onPress={handleInputSubmit}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="white" />
          </Pressable>
        )}
      </View>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ScrollView style={styles.suggestionsList}>
            {filteredSuggestions.map((suggestion, index) => (
              <Pressable
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleAddTag(suggestion)}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {maxTags && (
        <Text style={[styles.counter, { color: colors.textSecondary }]}>
          {tags.length}/{maxTags} tags
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsContainer: {
    borderRadius: 12,
    padding: 8,
    minHeight: 48,
    marginBottom: 8,
  },
  tagsScroll: {
    flexDirection: 'row',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    padding: 12,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 150,
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 16,
  },
  counter: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});