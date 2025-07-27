import React from 'react';
import { 
  Pressable, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface AuthButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  isLoading?: boolean;
  isDisabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}

export function AuthButton({
  onPress,
  title,
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = true,
}: AuthButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.fullWidth),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: isDisabled ? colors.buttonDisabled : colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: isDisabled ? colors.buttonDisabled : colors.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled ? colors.buttonDisabled : colors.primary,
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingVertical: 8,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.text,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: colors.buttonText,
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: colors.primary,
        };
      case 'outline':
      case 'text':
        return {
          ...baseStyle,
          color: isDisabled ? colors.buttonDisabled : colors.primary,
        };
      default:
        return baseStyle;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return colors.buttonText;
      case 'secondary':
        return colors.primary;
      case 'outline':
      case 'text':
        return isDisabled ? colors.buttonDisabled : colors.primary;
      default:
        return colors.primary;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyles(),
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled || isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.buttonText : colors.primary} 
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <Ionicons 
              name={leftIcon} 
              size={20} 
              color={getIconColor()} 
              style={styles.leftIcon}
            />
          )}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
          {rightIcon && (
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={getIconColor()} 
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});