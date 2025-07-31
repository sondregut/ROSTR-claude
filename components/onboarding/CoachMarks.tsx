import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COACH_MARKS } from '@/constants/OnboardingContent';
import { onboardingService } from '@/services/onboardingService';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CoachMark {
  id: string;
  targetY: number;
  targetX: number;
  targetWidth: number;
  targetHeight: number;
  title: string;
  description: string;
  position?: 'above' | 'below';
}

interface CoachMarksProps {
  visible: boolean;
  onComplete: () => void;
  marks: CoachMark[];
}

export const CoachMarks: React.FC<CoachMarksProps> = ({
  visible,
  onComplete,
  marks,
}) => {
  const [currentMarkIndex, setCurrentMarkIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (visible && marks.length > 0) {
      // Small delay before showing content
      setTimeout(() => setShowContent(true), 300);
    } else {
      setShowContent(false);
    }
  }, [visible, currentMarkIndex]);

  const handleNext = () => {
    if (currentMarkIndex < marks.length - 1) {
      setShowContent(false);
      setTimeout(() => {
        setCurrentMarkIndex(currentMarkIndex + 1);
      }, 200);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await onboardingService.markCoachMarksSeen();
    onComplete();
  };

  if (!visible || marks.length === 0) {
    return null;
  }

  const currentMark = marks[currentMarkIndex];
  const isLastMark = currentMarkIndex === marks.length - 1;
  const position = currentMark.position || 'above';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Dark overlay with cutout */}
        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.overlay} />
          
          {/* Highlight area */}
          <View
            style={[
              styles.highlight,
              {
                top: currentMark.targetY - 8,
                left: currentMark.targetX - 8,
                width: currentMark.targetWidth + 16,
                height: currentMark.targetHeight + 16,
              },
            ]}
          />
        </View>

        {/* Content */}
        {showContent && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.content,
              position === 'above'
                ? {
                    bottom: SCREEN_HEIGHT - currentMark.targetY + 20,
                    left: 20,
                    right: 20,
                  }
                : {
                    top: currentMark.targetY + currentMark.targetHeight + 20,
                    left: 20,
                    right: 20,
                  },
            ]}
          >
            <BlurView intensity={90} tint="light" style={styles.blurContainer}>
              {/* Arrow pointing to target */}
              <View
                style={[
                  styles.arrow,
                  position === 'above' ? styles.arrowDown : styles.arrowUp,
                  {
                    left: currentMark.targetX + currentMark.targetWidth / 2 - 30,
                  },
                ]}
              />

              {/* Text content */}
              <View style={styles.textContent}>
                <Text style={styles.title}>{currentMark.title}</Text>
                <Text style={styles.description}>{currentMark.description}</Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable onPress={handleSkip} style={styles.skipButton}>
                  <Text style={styles.skipText}>Skip Tour</Text>
                </Pressable>

                <View style={styles.progress}>
                  <Text style={styles.progressText}>
                    {currentMarkIndex + 1} of {marks.length}
                  </Text>
                </View>

                <Pressable onPress={handleNext} style={styles.nextButton}>
                  <Text style={styles.nextText}>
                    {isLastMark ? 'Done' : 'Next'}
                  </Text>
                  <Ionicons
                    name={isLastMark ? 'checkmark' : 'arrow-forward'}
                    size={16}
                    color="#FE5268"
                  />
                </Pressable>
              </View>
            </BlurView>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

// Helper function to create coach marks from tab bar refs
export const createTabBarCoachMarks = (tabRefs: any[]): CoachMark[] => {
  const marks: CoachMark[] = [];
  const tabNames = ['feed', 'roster', 'update', 'circles', 'profile'];

  tabRefs.forEach((ref, index) => {
    if (ref?.current && COACH_MARKS[tabNames[index]]) {
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        marks.push({
          id: tabNames[index],
          targetX: pageX,
          targetY: pageY,
          targetWidth: width,
          targetHeight: height,
          title: COACH_MARKS[tabNames[index]].title,
          description: COACH_MARKS[tabNames[index]].description,
          position: 'above',
        });
      });
    }
  });

  return marks;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  highlight: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FE5268',
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    maxWidth: 400,
    alignSelf: 'center',
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  arrowUp: {
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.9)',
    top: -10,
  },
  arrowDown: {
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    bottom: -10,
  },
  textContent: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 12,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#999',
  },
  progress: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#999',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  nextText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FE5268',
  },
});