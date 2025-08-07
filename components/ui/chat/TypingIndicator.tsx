import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  AppState,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TypingUser } from '@/services/supabase/circleChat';
import { SafeAnimated } from '@/utils/globalAnimationManager';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values for dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation>();
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Track app state
    const handleAppStateChange = (nextAppState: AppState.AppStateStatus) => {
      if (appStateRef.current === 'active' && nextAppState !== 'active') {
        // Stop animations when app goes to background
        animationRef.current?.stop();
        dot1Anim.setValue(0);
        dot2Anim.setValue(0);
        dot3Anim.setValue(0);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (typingUsers.length > 0 && appStateRef.current === 'active') {
      // Start animations
      const createAnimation = (animValue: Animated.Value, delay: number) => {
        return SafeAnimated.loop(
          SafeAnimated.sequence([
            SafeAnimated.timing(animValue, {
              toValue: -5,
              duration: 300,
              delay,
              useNativeDriver: true,
            }),
            SafeAnimated.timing(animValue, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };

      animationRef.current = SafeAnimated.parallel([
        createAnimation(dot1Anim, 0),
        createAnimation(dot2Anim, 100),
        createAnimation(dot3Anim, 200),
      ]);
      
      animationRef.current.start();
    } else {
      // Stop animations
      animationRef.current?.stop();
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    }

    return () => {
      subscription.remove();
      animationRef.current?.stop();
    };
  }, [typingUsers.length]);

  if (typingUsers.length === 0) return null;

  // Format typing text
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
    } else {
      return `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.typingContainer}>
        {/* Show first user's avatar */}
        <Image 
          source={{ uri: typingUsers[0].userAvatar }} 
          style={styles.avatar}
        />
        
        {/* Typing bubble */}
        <View style={[
          styles.bubble,
          { backgroundColor: colors.card, borderColor: colors.border }
        ]}>
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.textSecondary },
                { transform: [{ translateY: dot1Anim }] }
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.textSecondary },
                { transform: [{ translateY: dot2Anim }] }
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.textSecondary },
                { transform: [{ translateY: dot3Anim }] }
              ]}
            />
          </View>
        </View>
      </View>
      
      <Text style={[styles.typingText, { color: colors.textSecondary }]}>
        {getTypingText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typingText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 40,
  },
});