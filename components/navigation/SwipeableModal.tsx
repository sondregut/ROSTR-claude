import React, { useRef, useEffect } from 'react';
import {
  Modal,
  ModalProps,
  View,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
  ViewStyle,
} from 'react-native';
import { useThermalState } from '@/utils/thermalStateManager';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

export interface SwipeableModalProps extends ModalProps {
  children: React.ReactNode;
  onSwipeDown?: () => void;
  swipeToCloseEnabled?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  style?: ViewStyle;
}

export function SwipeableModal({
  children,
  visible,
  onRequestClose,
  onSwipeDown,
  swipeToCloseEnabled = true,
  animationType = 'slide',
  style,
  ...modalProps
}: SwipeableModalProps) {
  const { shouldDisableAnimations } = useThermalState();
  const translateY = useRef(new Animated.Value(0)).current;
  const lastGestureDy = useRef(0);

  // Reset position when modal opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const handleClose = () => {
    if (onSwipeDown) {
      onSwipeDown();
    } else if (onRequestClose) {
      onRequestClose();
    }
  };

  const animateClose = (velocity = 0) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: shouldDisableAnimations ? 0 : 300,
      useNativeDriver: true,
    }).start(() => {
      handleClose();
    });
  };

  const animateReset = () => {
    Animated.spring(translateY, {
      toValue: 0,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward swipes
        return swipeToCloseEnabled && gestureState.dy > 10 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        // Store the current position
        lastGestureDy.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          lastGestureDy.current = gestureState.dy;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Check if swipe was fast enough or far enough
        if (
          gestureState.dy > SWIPE_THRESHOLD ||
          gestureState.vy > SWIPE_VELOCITY_THRESHOLD
        ) {
          animateClose(gestureState.vy);
        } else {
          animateReset();
        }
      },
    })
  ).current;

  // Force no animation if device is hot
  const finalAnimationType = shouldDisableAnimations ? 'none' : animationType;

  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      animationType={finalAnimationType}
      transparent
      {...modalProps}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <Animated.View
          style={[
            {
              flex: 1,
              transform: [{ translateY }],
            },
            style,
          ]}
          {...(swipeToCloseEnabled ? panResponder.panHandlers : {})}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export default SwipeableModal;