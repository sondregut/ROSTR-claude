import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
  Image,
  AppState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingIndicator } from './OnboardingIndicator';
import { ONBOARDING_SLIDES } from '@/constants/OnboardingContent';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Auto-advance timer with app state management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppState.AppStateStatus) => {
      if (appStateRef.current === 'active' && nextAppState !== 'active') {
        // Stop auto-scroll when app goes to background
        stopAutoScroll();
      } else if (appStateRef.current !== 'active' && nextAppState === 'active') {
        // Resume auto-scroll when app comes back to foreground
        startAutoScroll();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Only start auto-scroll if app is active
    if (appStateRef.current === 'active') {
      startAutoScroll();
    }
    
    return () => {
      subscription.remove();
      stopAutoScroll();
    };
  }, []);

  const startAutoScroll = () => {
    // Clear any existing timer first
    stopAutoScroll();
    
    autoScrollTimer.current = setInterval(() => {
      // Check if app is still active before scrolling
      if (appStateRef.current !== 'active') {
        stopAutoScroll();
        return;
      }
      
      const nextIndex = currentIndex.value + 1;
      if (nextIndex < ONBOARDING_SLIDES.length) {
        scrollRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
      } else {
        stopAutoScroll();
      }
    }, 5000); // 5 seconds per slide
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      currentIndex.value = Math.round(event.contentOffset.x / SCREEN_WIDTH);
    },
    onBeginDrag: () => {
      runOnJS(stopAutoScroll)();
    },
    onEndDrag: () => {
      runOnJS(startAutoScroll)();
    },
  });

  const handleNext = () => {
    // Don't navigate if app is not active
    if (appStateRef.current !== 'active') return;
    
    const nextIndex = currentIndex.value + 1;
    if (nextIndex < ONBOARDING_SLIDES.length) {
      scrollRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      stopAutoScroll();
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFF8F3', '#FFE0CC']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Skip button */}
          <View style={styles.header}>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          {/* Content */}
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            bounces={false}
          >
            {ONBOARDING_SLIDES.map((slide, index) => (
              <OnboardingSlide
                key={slide.id}
                slide={slide}
                index={index}
                scrollX={scrollX}
              />
            ))}
          </Animated.ScrollView>
        </SafeAreaView>

        {/* Bottom section */}
        <SafeAreaView style={styles.bottomSection} edges={['bottom']}>
          {/* Indicators */}
          <OnboardingIndicator
            count={ONBOARDING_SLIDES.length}
            activeIndex={currentIndex}
          />

          {/* Action button */}
          <Pressable onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentIndex.value === ONBOARDING_SLIDES.length - 1
                ? "Let's Get Started"
                : 'Next'}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </>
  );
};

interface OnboardingSlideProps {
  slide: typeof ONBOARDING_SLIDES[0];
  index: number;
  scrollX: Animated.SharedValue<number>;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  slide,
  index,
  scrollX,
}) => {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const titleStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [SCREEN_WIDTH * 0.5, 0, -SCREEN_WIDTH * 0.5],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  const descriptionStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [SCREEN_WIDTH * 0.7, 0, -SCREEN_WIDTH * 0.7],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.slide}>
      <View style={styles.content}>
        {/* Icon/Graphic */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          {slide.icon ? (
            <View style={styles.iconBackground}>
              <Ionicons name={slide.icon as any} size={80} color="#FE5268" />
            </View>
          ) : slide.image ? (
            <Image source={slide.image} style={styles.slideImage} />
          ) : (
            <Image
              source={require('@/assets/images/rostr-logo.png')}
              style={styles.logo}
            />
          )}
        </Animated.View>

        {/* Text content */}
        <View style={styles.textContent}>
          {slide.subtitle && (
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          )}
          
          <Animated.Text style={[styles.title, titleStyle]}>
            {slide.title}
          </Animated.Text>

          <Animated.Text style={[styles.description, descriptionStyle]}>
            {slide.description}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 180, // Space for bottom section
  },
  iconContainer: {
    marginBottom: 60,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(254, 82, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  textContent: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#FE5268',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 32,
  },
  nextButton: {
    backgroundColor: '#FE5268',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});