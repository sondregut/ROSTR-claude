import React, { useRef } from 'react';
import {
  View,
  PanResponder,
  Animated,
  Dimensions,
  ViewStyle,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThermalState } from '@/utils/thermalStateManager';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY_THRESHOLD = 0.3;
// Increase edge detection area for production builds
const EDGE_DETECTION_WIDTH = Platform.OS === 'ios' ? 40 : 50;

export interface SwipeableScreenProps {
  children: React.ReactNode;
  onSwipeBack?: () => void;
  swipeBackEnabled?: boolean;
  style?: ViewStyle;
}

export function SwipeableScreen({
  children,
  onSwipeBack,
  swipeBackEnabled = true,
  style,
}: SwipeableScreenProps) {
  const router = useRouter();
  const { shouldDisableAnimations } = useThermalState();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handleSwipeBack = () => {
    if (onSwipeBack) {
      onSwipeBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const animateOut = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: shouldDisableAnimations ? 0 : 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.5,
        duration: shouldDisableAnimations ? 0 : 250,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const animateReset = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes from the left edge
        const startedNearEdge = gestureState.x0 < EDGE_DETECTION_WIDTH;
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isRightSwipe = gestureState.dx > 10; // Lower threshold for better detection
        
        // Debug logging for production testing
        logger.debug('[SwipeableScreen] Gesture detected:', {
          startedNearEdge,
          isHorizontalSwipe,
          isRightSwipe,
          x0: gestureState.x0,
          dx: gestureState.dx,
          dy: gestureState.dy,
          swipeBackEnabled,
          edgeWidth: EDGE_DETECTION_WIDTH
        });
        
        return swipeBackEnabled && startedNearEdge && isHorizontalSwipe && isRightSwipe;
      },
      onPanResponderGrant: () => {
        // Provide immediate feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow rightward movement
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
          // Fade out as we swipe
          const progress = gestureState.dx / SCREEN_WIDTH;
          opacity.setValue(1 - progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Check if swipe was fast enough or far enough
        if (
          gestureState.dx > SWIPE_THRESHOLD ||
          gestureState.vx > SWIPE_VELOCITY_THRESHOLD
        ) {
          animateOut(() => {
            handleSwipeBack();
          });
        } else {
          animateReset();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          transform: [{ translateX }],
          opacity,
        },
        style,
      ]}
      {...(swipeBackEnabled ? panResponder.panHandlers : {})}
    >
      {children}
    </Animated.View>
  );
}

// HOC version for easier wrapping
export function withSwipeableScreen<P extends object>(
  Component: React.ComponentType<P>,
  swipeBackEnabled = true
) {
  return React.forwardRef<any, P>((props, ref) => (
    <SwipeableScreen swipeBackEnabled={swipeBackEnabled}>
      <Component {...props} ref={ref} />
    </SwipeableScreen>
  ));
}

export default SwipeableScreen;