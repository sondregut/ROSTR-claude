import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dropdown } from '@/components/ui/inputs/Dropdown';

interface Lifestyle {
  drinking: string;
  smoking: string;
  exercise: string;
  diet: string;
}

interface LifestyleEditFormProps {
  initialLifestyle: Lifestyle;
  onChange: (lifestyle: Lifestyle) => void;
}

const DRINKING_OPTIONS = [
  { label: 'Never', value: 'Never' },
  { label: 'Socially', value: 'Socially' },
  { label: 'Occasionally', value: 'Occasionally' },
  { label: 'Frequently', value: 'Frequently' },
];

const SMOKING_OPTIONS = [
  { label: 'Never', value: 'Never' },
  { label: 'Trying to quit', value: 'Trying to quit' },
  { label: 'Occasionally', value: 'Occasionally' },
  { label: 'Regularly', value: 'Regularly' },
];

const EXERCISE_OPTIONS = [
  { label: 'Never', value: 'Never' },
  { label: 'Sometimes', value: 'Sometimes' },
  { label: 'Regularly', value: 'Regularly' },
  { label: 'Daily', value: 'Daily' },
];

const DIET_OPTIONS = [
  { label: 'No restrictions', value: 'No restrictions' },
  { label: 'Vegetarian', value: 'Vegetarian' },
  { label: 'Vegan', value: 'Vegan' },
  { label: 'Pescatarian', value: 'Pescatarian' },
  { label: 'Keto', value: 'Keto' },
  { label: 'Gluten-free', value: 'Gluten-free' },
  { label: 'Other', value: 'Other' },
];

export function LifestyleEditForm({
  initialLifestyle,
  onChange,
}: LifestyleEditFormProps) {
  const [lifestyle, setLifestyle] = useState(initialLifestyle);

  const handleChange = (field: keyof Lifestyle, value: string) => {
    const updatedLifestyle = { ...lifestyle, [field]: value };
    setLifestyle(updatedLifestyle);
    onChange(updatedLifestyle);
  };

  return (
    <View style={styles.container}>
      <Dropdown
        label="Drinking"
        value={lifestyle.drinking}
        options={DRINKING_OPTIONS}
        onValueChange={(value) => handleChange('drinking', value)}
      />

      <Dropdown
        label="Smoking"
        value={lifestyle.smoking}
        options={SMOKING_OPTIONS}
        onValueChange={(value) => handleChange('smoking', value)}
      />

      <Dropdown
        label="Exercise"
        value={lifestyle.exercise}
        options={EXERCISE_OPTIONS}
        onValueChange={(value) => handleChange('exercise', value)}
      />

      <Dropdown
        label="Diet"
        value={lifestyle.diet}
        options={DIET_OPTIONS}
        onValueChange={(value) => handleChange('diet', value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});