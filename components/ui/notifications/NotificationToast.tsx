import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Pressable,
  Dimensions,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface NotificationToastProps {
  title: string;
  body: string;
  onPress?: () => void;
  onDismiss?: () => void;
  duration?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOAST_WIDTH = SCREEN_WIDTH - 32;
const ANIMATION_DURATION = 300;

export function NotificationToast({
  title,
  body,
  onPress,
  onDismiss,
  duration = 4000,
  icon = 'notifications',
  iconColor,
}: NotificationToastProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Show animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Auto dismiss
    dismissTimer.current = setTimeout(() => {
      dismiss();
    }, duration);

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const handlePress = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
    }
    dismiss();
    onPress?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        style={[
          styles.toast,
          {
            backgroundColor: colors.card,
            shadowColor: colors.text,
          },
        ]}
        onPress={handlePress}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor || colors.primary}15` }]}>
          <Ionicons name={icon} size={24} color={iconColor || colors.primary} />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
            {body}
          </Text>
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    width: TOAST_WIDTH,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
});