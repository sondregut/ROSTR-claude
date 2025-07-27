import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dropdown } from '@/components/ui/inputs/Dropdown';

interface DatingPreferences {
  lookingFor: string;
  ageRange: string;
  distance: string;
  education: string;
}

interface DatingPreferencesEditFormProps {
  initialPreferences: DatingPreferences;
  onChange: (preferences: DatingPreferences) => void;
}

const LOOKING_FOR_OPTIONS = [
  { label: 'Serious Relationship', value: 'Serious Relationship' },
  { label: 'Casual Dating', value: 'Casual Dating' },
  { label: 'Friendship', value: 'Friendship' },
  { label: 'Not Sure Yet', value: 'Not Sure Yet' },
];

const AGE_RANGE_OPTIONS = [
  { label: '18-25', value: '18-25' },
  { label: '25-35', value: '25-35' },
  { label: '35-45', value: '35-45' },
  { label: '45-55', value: '45-55' },
  { label: '55+', value: '55+' },
];

const DISTANCE_OPTIONS = [
  { label: 'Within 5 miles', value: 'Within 5 miles' },
  { label: 'Within 10 miles', value: 'Within 10 miles' },
  { label: 'Within 25 miles', value: 'Within 25 miles' },
  { label: 'Within 50 miles', value: 'Within 50 miles' },
  { label: 'Within 100 miles', value: 'Within 100 miles' },
  { label: 'Anywhere', value: 'Anywhere' },
];

const EDUCATION_OPTIONS = [
  { label: 'High School', value: 'High School' },
  { label: 'College', value: 'College' },
  { label: 'College+', value: 'College+' },
  { label: 'Graduate Degree', value: 'Graduate Degree' },
  { label: 'No Preference', value: 'No Preference' },
];

export function DatingPreferencesEditForm({
  initialPreferences,
  onChange,
}: DatingPreferencesEditFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences);

  const handleChange = (field: keyof DatingPreferences, value: string) => {
    const updatedPreferences = { ...preferences, [field]: value };
    setPreferences(updatedPreferences);
    onChange(updatedPreferences);
  };

  return (
    <View style={styles.container}>
      <Dropdown
        label="Looking For"
        value={preferences.lookingFor}
        options={LOOKING_FOR_OPTIONS}
        onValueChange={(value) => handleChange('lookingFor', value)}
      />

      <Dropdown
        label="Age Range"
        value={preferences.ageRange}
        options={AGE_RANGE_OPTIONS}
        onValueChange={(value) => handleChange('ageRange', value)}
      />

      <Dropdown
        label="Distance"
        value={preferences.distance}
        options={DISTANCE_OPTIONS}
        onValueChange={(value) => handleChange('distance', value)}
      />

      <Dropdown
        label="Education Level"
        value={preferences.education}
        options={EDUCATION_OPTIONS}
        onValueChange={(value) => handleChange('education', value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});