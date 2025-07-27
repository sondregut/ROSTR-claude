import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (otp: string) => void;
  error?: string;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChangeText,
  error,
  autoFocus = true,
}: OtpInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const inputRefs = useRef<TextInput[]>([]);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleChangeText = (text: string, index: number) => {
    // Remove any non-numeric characters
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // Handle paste operation
      const newOtp = numericText.slice(0, length);
      onChangeText(newOtp);
      
      // Focus the next empty field or the last field
      const nextIndex = Math.min(newOtp.length, length - 1);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 0);
    } else {
      // Handle single character input
      const otpArray = value.split('');
      otpArray[index] = numericText;
      
      // Fill in the missing characters with empty strings
      while (otpArray.length < length) {
        otpArray.push('');
      }
      
      const newOtp = otpArray.join('').slice(0, length);
      onChangeText(newOtp);
      
      // Auto-focus next input if current input has a value
      if (numericText && index < length - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 0);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const otpArray = value.split('');
      
      if (otpArray[index]) {
        // Clear current field
        otpArray[index] = '';
        onChangeText(otpArray.join(''));
      } else if (index > 0) {
        // Move to previous field and clear it
        const prevIndex = index - 1;
        otpArray[prevIndex] = '';
        onChangeText(otpArray.join(''));
        setTimeout(() => {
          inputRefs.current[prevIndex]?.focus();
        }, 0);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const handleInputPress = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const getInputValue = (index: number) => {
    return value[index] || '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {Array.from({ length }, (_, index) => (
          <Pressable
            key={index}
            style={[
              styles.inputWrapper,
              {
                borderColor: error 
                  ? colors.error 
                  : focusedIndex === index 
                    ? colors.primary 
                    : colors.border,
                backgroundColor: colors.card,
              }
            ]}
            onPress={() => handleInputPress(index)}
          >
            <TextInput
              ref={(ref) => {
                if (ref) {
                  inputRefs.current[index] = ref;
                }
              }}
              style={[styles.input, { color: colors.text }]}
              value={getInputValue(index)}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
              secureTextEntry={false}
            />
          </Pressable>
        ))}
      </View>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  inputWrapper: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  error: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
});