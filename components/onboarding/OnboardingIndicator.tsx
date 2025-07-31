import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface OnboardingIndicatorProps {
  count: number;
  activeIndex: Animated.SharedValue<number>;
}

export const OnboardingIndicator: React.FC<OnboardingIndicatorProps> = ({
  count,
  activeIndex,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Dot key={index} index={index} activeIndex={activeIndex} />
      ))}
    </View>
  );
};

interface DotProps {
  index: number;
  activeIndex: Animated.SharedValue<number>;
}

const Dot: React.FC<DotProps> = ({ index, activeIndex }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;
    const opacity = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [1, 1.3, 1],
      Extrapolate.CLAMP
    );

    const width = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [8, 24, 8],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
      width,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
});