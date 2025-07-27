import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from '@/components/ui/inputs/TextInput';

interface BasicInfo {
  location: string;
  occupation: string;
  age: number;
}

interface BasicInfoEditFormProps {
  initialInfo: BasicInfo;
  onChange: (info: BasicInfo) => void;
}

export function BasicInfoEditForm({ initialInfo, onChange }: BasicInfoEditFormProps) {
  const [info, setInfo] = useState(initialInfo);

  const handleChange = (field: keyof BasicInfo, value: string | number) => {
    const updatedInfo = { ...info, [field]: value };
    setInfo(updatedInfo);
    onChange(updatedInfo);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Location"
        value={info.location}
        onChangeText={(text) => handleChange('location', text)}
        placeholder="City, State"
      />
      
      <TextInput
        label="Occupation"
        value={info.occupation}
        onChangeText={(text) => handleChange('occupation', text)}
        placeholder="Your profession"
      />
      
      <TextInput
        label="Age"
        value={info.age.toString()}
        onChangeText={(text) => {
          const age = parseInt(text) || 0;
          if (age >= 18 && age <= 100) {
            handleChange('age', age);
          }
        }}
        keyboardType="numeric"
        placeholder="Your age"
        maxLength={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});