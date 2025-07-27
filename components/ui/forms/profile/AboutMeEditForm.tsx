import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput } from '@/components/ui/inputs/TextInput';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface AboutMeEditFormProps {
  initialBio: string;
  onChange: (bio: string) => void;
}

export function AboutMeEditForm({ initialBio, onChange }: AboutMeEditFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [bio, setBio] = useState(initialBio);

  const handleChange = (text: string) => {
    setBio(text);
    onChange(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="About Me"
        value={bio}
        onChangeText={handleChange}
        multiline
        numberOfLines={6}
        maxLength={500}
        placeholder="Tell us about yourself..."
        textAlignVertical="top"
        inputStyle={styles.bioInput}
      />
      <Text style={[styles.charCount, { color: colors.textSecondary }]}>
        {bio.length}/500 characters
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bioInput: {
    minHeight: 150,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});