// Reaction data formatted for react-native-reactions library
export interface ReactionItem {
  id: string;
  emoji: string;
  title: string;
}

export const ReactionItems: ReactionItem[] = [
  {
    id: 'love',
    emoji: '❤️',
    title: 'Love',
  },
  {
    id: 'funny',
    emoji: '😂',
    title: 'Funny',
  },
  {
    id: 'exciting',
    emoji: '😍',
    title: 'Exciting',
  },
  {
    id: 'hot',
    emoji: '🔥',
    title: 'Hot',
  },
  {
    id: 'awkward',
    emoji: '😳',
    title: 'Awkward',
  },
  {
    id: 'fail',
    emoji: '💔',
    title: 'Didn\'t work',
  },
  {
    id: 'celebrate',
    emoji: '🎉',
    title: 'Celebrate',
  },
];

// Helper function to get emoji by reaction ID
export const getEmojiById = (id: string): string => {
  const reaction = ReactionItems.find(item => item.id === id);
  return reaction?.emoji || '❤️';
};

// Helper function to get reaction by ID
export const getReactionById = (id: string): ReactionItem | undefined => {
  return ReactionItems.find(item => item.id === id);
};