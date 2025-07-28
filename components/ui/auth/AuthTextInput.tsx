import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface AuthTextInputProps extends Omit<RNTextInputProps, 'style'> {
  label: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: object;
  required?: boolean;
}

export function AuthTextInput({
  label,
  error,
  isPassword = false,
  leftIcon,
  containerStyle,
  required = false,
  ...props
}: AuthTextInputProps) {
  // Force light mode for auth components
  const colors = Colors.light;
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: colors.card,
          borderColor: error ? colors.error : colors.border,
        }
      ]}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={colors.textSecondary} 
            style={styles.leftIcon}
          />
        )}
        
        <RNTextInput
          style={[
            styles.input,
            { 
              color: colors.text,
              flex: 1,
            },
            leftIcon && styles.inputWithLeftIcon,
            isPassword && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          autoCorrect={false}
          {...props}
        />
        
        {isPassword && (
          <Pressable 
            onPress={togglePasswordVisibility}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  inputWithRightIcon: {
    marginRight: 8,
  },
  leftIcon: {
    marginRight: 0,
  },
  rightIcon: {
    padding: 4,
  },
  error: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
});