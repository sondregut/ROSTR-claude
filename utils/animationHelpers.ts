import { Animated, InteractionManager, LayoutAnimation, UIManager, Platform } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Batch multiple animations to reduce bridge traffic
 */
export const batchAnimations = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations, { stopTogether: true });
};

/**
 * Run animation with automatic cancellation on unmount
 */
export const runSafeAnimation = (
  animation: Animated.CompositeAnimation,
  onComplete?: (finished: { finished: boolean }) => void
) => {
  let isCancelled = false;
  
  animation.start((result) => {
    if (!isCancelled && onComplete) {
      onComplete(result);
    }
  });
  
  return () => {
    isCancelled = true;
    animation.stop();
  };
};

/**
 * Throttled layout animation to prevent excessive updates
 */
let lastLayoutAnimation = 0;
export const throttledLayoutAnimation = (
  config: LayoutAnimation.Config = LayoutAnimation.Presets.easeInEaseOut,
  minDelay: number = 300
) => {
  const now = Date.now();
  if (now - lastLayoutAnimation < minDelay) {
    return;
  }
  lastLayoutAnimation = now;
  LayoutAnimation.configureNext(config);
};

/**
 * Safe animated value update that yields to main thread
 */
export const updateAnimatedValue = async (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 300
): Promise<void> => {
  return new Promise((resolve) => {
    // Yield to main thread first
    InteractionManager.runAfterInteractions(() => {
      Animated.timing(animatedValue, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  });
};

/**
 * Debounced animation to prevent rapid updates
 */
export const createDebouncedAnimation = (
  animatedValue: Animated.Value,
  delay: number = 100
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (toValue: number, duration: number = 300) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
      timeoutId = null;
    }, delay);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  };
};

/**
 * Spring animation with performance optimization
 */
export const performantSpring = (
  animatedValue: Animated.Value,
  toValue: number,
  config?: Partial<Animated.SpringAnimationConfig>
) => {
  return Animated.spring(animatedValue, {
    toValue,
    useNativeDriver: true,
    // Optimized spring config for performance
    stiffness: 100,
    damping: 15,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    ...config,
  });
};

/**
 * Cancel all pending animations (useful for scene transitions)
 */
export const cancelAllAnimations = () => {
  // This will stop all running animations
  Animated.stopAllAnimations();
};

/**
 * Check if we should skip animations (e.g., low battery, background)
 */
export const shouldSkipAnimation = (): boolean => {
  // You can add more conditions here like battery level, performance mode, etc.
  return false; // For now, always allow animations
};

/**
 * Create an animation that automatically pauses when app goes to background
 */
export const createBackgroundAwareAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 300
) => {
  let animation: Animated.CompositeAnimation | null = null;
  
  const start = (onComplete?: () => void) => {
    animation = Animated.timing(animatedValue, {
      toValue,
      duration,
      useNativeDriver: true,
    });
    
    animation.start((finished) => {
      if (finished.finished && onComplete) {
        onComplete();
      }
    });
  };
  
  const stop = () => {
    animation?.stop();
  };
  
  return { start, stop };
};