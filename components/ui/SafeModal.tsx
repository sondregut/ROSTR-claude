import React from 'react';
import { Modal, ModalProps } from 'react-native';
import { useThermalState } from '@/utils/thermalStateManager';

export interface SafeModalProps extends ModalProps {
  // Override animationType to make it optional with 'none' as default
  animationType?: 'none' | 'slide' | 'fade';
}

/**
 * SafeModal is a wrapper around React Native's Modal that:
 * 1. Defaults to no animation
 * 2. Forces no animation when device is hot
 * 3. Prevents watchdog timeout crashes
 */
export function SafeModal(props: SafeModalProps) {
  const { shouldDisableAnimations } = useThermalState();
  
  // Force no animation if device is hot or animation type is not specified
  const animationType = shouldDisableAnimations || !props.animationType 
    ? 'none' 
    : props.animationType;
  
  return (
    <Modal
      {...props}
      animationType={animationType}
    />
  );
}

// Export as default to make it easy to replace Modal imports
export default SafeModal;