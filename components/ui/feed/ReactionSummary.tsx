import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { REACTIONS, ReactionType } from './ReactionPicker';

interface ReactionCount {
  type: ReactionType;
  count: number;
  users?: string[];
}

interface ReactionSummaryProps {
  reactions: ReactionCount[];
  onPress?: () => void;
  maxDisplay?: number;
}

export function ReactionSummary({ 
  reactions, 
  onPress,
  maxDisplay = 3 
}: ReactionSummaryProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!reactions || reactions.length === 0) return null;

  const sortedReactions = [...reactions]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxDisplay);

  const totalCount = reactions.reduce((sum, r) => sum + r.count, 0);

  const getEmoji = (type: ReactionType) => {
    return REACTIONS.find(r => r.type === type)?.emoji || '❤️';
  };

  return (
    <Pressable 
      style={styles.container} 
      onPress={onPress}
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    >
      <View style={styles.emojisContainer}>
        {sortedReactions.map((reaction, index) => (
          <View 
            key={reaction.type} 
            style={[
              styles.emojiContainer,
              { 
                zIndex: sortedReactions.length - index,
                marginLeft: index > 0 ? -8 : 0,
              }
            ]}
          >
            <View style={[
              styles.emojiBubble,
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}>
              <Text style={styles.emoji}>{getEmoji(reaction.type)}</Text>
            </View>
          </View>
        ))}
      </View>
      {totalCount > 0 && (
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {totalCount}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiContainer: {
    position: 'relative',
  },
  emojiBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});