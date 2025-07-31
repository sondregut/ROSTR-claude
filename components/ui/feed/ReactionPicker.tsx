import React from 'react';
import { View, Pressable, Text, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type ReactionType = 'love' | 'funny' | 'exciting' | 'hot' | 'awkward' | 'fail' | 'celebrate';

export interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
}

export const REACTIONS: Reaction[] = [
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'funny', emoji: '😂', label: 'Funny' },
  { type: 'exciting', emoji: '😍', label: 'Exciting' },
  { type: 'hot', emoji: '🔥', label: 'Hot' },
  { type: 'awkward', emoji: '😳', label: 'Awkward' },
  { type: 'fail', emoji: '💔', label: 'Didn\'t work' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
];

interface ReactionPickerProps {
  visible: boolean;
  onSelectReaction: (reaction: ReactionType) => void;
  selectedReaction?: ReactionType | null;
  style?: any;
}

export function ReactionPicker({ 
  visible, 
  onSelectReaction, 
  selectedReaction,
  style 
}: ReactionPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 40,
      friction: 5,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: scaleAnim }],
        },
        style
      ]}
    >
      {REACTIONS.map((reaction, index) => (
        <Pressable
          key={reaction.type}
          onPress={() => onSelectReaction(reaction.type)}
          style={[
            styles.reactionButton,
            selectedReaction === reaction.type && styles.selectedReaction,
            { borderColor: colors.border }
          ]}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Animated.Text style={[
            styles.emoji,
            {
              transform: [{
                scale: selectedReaction === reaction.type ? 1.2 : 1
              }]
            }
          ]}>
            {reaction.emoji}
          </Animated.Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: -10,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
  },
  reactionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedReaction: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  emoji: {
    fontSize: 24,
  },
});