import React, { useState } from 'react';
import { View, StyleSheet, Text, useColorScheme } from 'react-native';
import { TagInput } from '@/components/ui/inputs/TagInput';
import { Colors } from '@/constants/Colors';

interface InterestsEditFormProps {
  initialInterests: string[];
  onChange: (interests: string[]) => void;
}

const SUGGESTED_INTERESTS = [
  'Coffee', 'Hiking', 'Photography', 'Cooking', 'Travel', 
  'Art', 'Music', 'Fitness', 'Reading', 'Movies',
  'Dancing', 'Gaming', 'Yoga', 'Wine', 'Sports',
  'Nature', 'Technology', 'Fashion', 'Food', 'Meditation',
  'Theater', 'Concerts', 'Museums', 'Outdoors', 'Crafts'
];

export function InterestsEditForm({ initialInterests, onChange }: InterestsEditFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [interests, setInterests] = useState(initialInterests);

  const handleChange = (newInterests: string[]) => {
    setInterests(newInterests);
    onChange(newInterests);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Add tags that represent your interests and hobbies. This helps others understand what you're passionate about.
      </Text>
      
      <TagInput
        label="Your Interests"
        tags={interests}
        onTagsChange={handleChange}
        placeholder="Add an interest"
        maxTags={20}
        suggestions={SUGGESTED_INTERESTS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});