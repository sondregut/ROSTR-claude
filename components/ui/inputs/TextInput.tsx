import React from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
  inputStyle?: object;
}

export function TextInput({
  label,
  error,
  containerStyle,
  inputStyle,
  ...props
}: TextInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <RNTextInput
        style={[
          styles.input,
          { 
            color: colors.text, 
            backgroundColor: colors.card,
            borderColor: error ? colors.error : colors.border,
          },
          inputStyle,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
});