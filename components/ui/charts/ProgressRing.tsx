import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
}

export function ProgressRing({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  color,
  showPercentage = true 
}: ProgressRingProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color || colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showPercentage && (
        <View style={styles.textContainer}>
          <Text style={[styles.percentage, { color: colors.text }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 18,
    fontWeight: '700',
  },
});