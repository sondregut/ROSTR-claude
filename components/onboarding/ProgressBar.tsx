import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  showLabel = true,
}) => {
  const progress = (currentStep / totalSteps) * 100;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${progress}%`, {
        damping: 15,
        stiffness: 100,
      }),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, animatedStyle]} />
      </View>
      {showLabel && (
        <Text style={styles.label}>
          Step {currentStep} of {totalSteps}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE5268',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});