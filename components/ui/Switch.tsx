import React from 'react';
import { Switch as RNSwitch, Platform, SwitchProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BrandedSwitchProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  // Allow override of colors if needed
  primaryColor?: string;
  borderColor?: string;
  thumbColor?: string;
}

export function Switch({
  primaryColor,
  borderColor,
  thumbColor,
  ...props
}: BrandedSwitchProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <RNSwitch
      trackColor={{
        false: borderColor || colors.border,
        true: primaryColor || colors.primary,
      }}
      thumbColor={
        thumbColor ||
        (Platform.OS === 'ios' ? '#FFFFFF' : props.value ? colors.card : '#f4f3f4')
      }
      ios_backgroundColor={borderColor || colors.border}
      {...props}
    />
  );
}