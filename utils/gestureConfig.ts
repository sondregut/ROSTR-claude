import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GestureConfig = {
  // Swipe thresholds
  swipe: {
    horizontal: {
      threshold: SCREEN_WIDTH * 0.3, // 30% of screen width
      velocityThreshold: 0.3,
      edgeDistance: 30, // Distance from edge to start swipe
    },
    vertical: {
      threshold: SCREEN_HEIGHT * 0.15, // 15% of screen height  
      velocityThreshold: 0.3,
    },
  },

  // Animation durations (in ms)
  animation: {
    fast: 200,
    normal: 300,
    slow: 400,
  },

  // Spring animation config
  spring: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },

  // Platform-specific settings
  platform: {
    ios: {
      gestureEnabled: true,
      animationType: 'ios',
      fullScreenGestureEnabled: true,
    },
    android: {
      gestureEnabled: true,
      animationType: 'fade',
      fullScreenGestureEnabled: false,
    },
  },

  // Get platform-specific config
  getPlatformConfig() {
    return Platform.select({
      ios: this.platform.ios,
      android: this.platform.android,
      default: this.platform.android,
    });
  },

  // Check if gestures should be enabled based on accessibility settings
  shouldEnableGestures(reduceMotion: boolean = false) {
    if (reduceMotion) {
      return false;
    }
    return true;
  },

  // Get animation duration based on thermal state
  getAnimationDuration(
    type: 'fast' | 'normal' | 'slow' = 'normal',
    shouldDisableAnimations: boolean = false
  ) {
    if (shouldDisableAnimations) {
      return 0;
    }
    return this.animation[type];
  },
};

// Gesture helper functions
export const GestureHelpers = {
  // Check if a gesture is a valid horizontal swipe
  isHorizontalSwipe(dx: number, dy: number): boolean {
    return Math.abs(dx) > Math.abs(dy);
  },

  // Check if a gesture is a valid vertical swipe
  isVerticalSwipe(dx: number, dy: number): boolean {
    return Math.abs(dy) > Math.abs(dx);
  },

  // Check if gesture started near edge
  isEdgeSwipe(x0: number, edge: 'left' | 'right' = 'left'): boolean {
    if (edge === 'left') {
      return x0 < GestureConfig.swipe.horizontal.edgeDistance;
    }
    return x0 > SCREEN_WIDTH - GestureConfig.swipe.horizontal.edgeDistance;
  },

  // Calculate swipe progress (0 to 1)
  calculateSwipeProgress(
    distance: number,
    dimension: number,
    threshold: number = 0.3
  ): number {
    return Math.min(Math.abs(distance) / (dimension * threshold), 1);
  },

  // Determine if swipe should trigger action
  shouldTriggerSwipe(
    distance: number,
    velocity: number,
    threshold: number,
    velocityThreshold: number
  ): boolean {
    return (
      Math.abs(distance) > threshold ||
      Math.abs(velocity) > velocityThreshold
    );
  },
};