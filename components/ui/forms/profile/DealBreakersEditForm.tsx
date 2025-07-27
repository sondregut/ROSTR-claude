import React, { useState } from 'react';
import { View, StyleSheet, Text, useColorScheme } from 'react-native';
import { TagInput } from '@/components/ui/inputs/TagInput';
import { Colors } from '@/constants/Colors';

interface DealBreakersEditFormProps {
  initialDealBreakers: string[];
  onChange: (dealBreakers: string[]) => void;
}

const SUGGESTED_DEAL_BREAKERS = [
  'Smoking', 'No sense of humor', 'Rude to service staff', 'Always late',
  'Poor hygiene', 'Dishonesty', 'No ambition', 'Bad communication',
  'Excessive drinking', 'Anger issues', 'Negativity', 'Close-minded',
  'Arrogance', 'Jealousy', 'Controlling behavior', 'Different values',
  'No emotional availability', 'Poor listener', 'Self-centered', 'Flaky'
];

export function DealBreakersEditForm({
  initialDealBreakers,
  onChange,
}: DealBreakersEditFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [dealBreakers, setDealBreakers] = useState(initialDealBreakers);

  const handleChange = (newDealBreakers: string[]) => {
    setDealBreakers(newDealBreakers);
    onChange(newDealBreakers);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Add things that are absolute no-gos for you in a relationship. Be honest about what matters most to you.
      </Text>
      
      <TagInput
        label="Deal Breakers"
        tags={dealBreakers}
        onTagsChange={handleChange}
        placeholder="Add a deal breaker"
        maxTags={15}
        suggestions={SUGGESTED_DEAL_BREAKERS}
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