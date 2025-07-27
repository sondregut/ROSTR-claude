import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DateFeed } from '@/components/ui/feed/DateFeed';
import { CommentModal } from '@/components/ui/modals/CommentModal';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock data for demonstration
const MOCK_DATES = [
  {
    id: '1',
    personName: 'Emma',
    date: '2h ago',
    location: 'Italian Restaurant',
    rating: 4.5,
    notes: 'Dinner date at that new Italian place was amazing! Great conversation, lots of laughing. Definitely seeing him again.',
    tags: ['Second Date', 'Chemistry'],
    poll: {
      question: 'Will there be a third date?',
      options: [
        { text: 'Yes', votes: 3 },
        { text: 'Maybe', votes: 1 },
        { text: 'No', votes: 0 }
      ]
    },
    userPollVote: null,
    comments: [
      { name: 'Jason', content: 'He sounds perfect! Can\'t wait to hear about the next date!' }
    ],
    likeCount: 0,
    commentCount: 1,
    isLiked: false,
  },
  {
    id: '2',
    personName: 'Jason',
    date: 'Yesterday',
    location: 'Coffee Shop',
    rating: 3.0,
    notes: 'Coffee meet-up was okay. Conversation was a bit forced but he seemed nice. Not sure if there\'s a spark.',
    tags: [],
    poll: {
      question: 'Should I see him again?',
      options: [
        { text: 'Give it another shot', votes: 5 },
        { text: 'Move on', votes: 2 }
      ]
    },
    userPollVote: null,
    comments: [],
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
  },
];

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [dates, setDates] = useState(MOCK_DATES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate a network request
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };
  
  const handleLike = (dateId: string) => {
    setDates(
      dates.map(date => 
        date.id === dateId 
          ? { 
              ...date, 
              isLiked: !date.isLiked,
              likeCount: date.isLiked ? date.likeCount - 1 : date.likeCount + 1 
            } 
          : date
      )
    );
  };
  
  const handleComment = (dateId: string) => {
    setSelectedDateId(dateId);
    setCommentModalVisible(true);
  };
  
  const handleSubmitComment = (text: string) => {
    if (!selectedDateId) return;
    
    setDates(
      dates.map(date => 
        date.id === selectedDateId
          ? {
              ...date,
              comments: [
                ...(date.comments || []),
                {
                  name: 'You',
                  content: text
                }
              ],
              commentCount: date.commentCount + 1
            }
          : date
      )
    );
  };
  
  const handlePollVote = (dateId: string, optionIndex: number) => {
    setDates(
      dates.map(date => {
        if (date.id === dateId && date.poll) {
          const updatedOptions = date.poll.options.map((option, index) => {
            if (index === optionIndex) {
              return { ...option, votes: option.votes + 1 };
            }
            return option;
          });
          
          return {
            ...date,
            poll: {
              ...date.poll,
              options: updatedOptions
            },
            userPollVote: optionIndex
          };
        }
        return date;
      })
    );
  };
  
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No dates in your feed
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Add your first date or follow friends to see their updates
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Feed</Text>
      </View>
      <DateFeed
        data={dates}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onDatePress={(dateId) => console.log(`Navigate to date detail ${dateId}`)}
        onLike={handleLike}
        onComment={handleComment}
        onPollVote={handlePollVote}
        ListEmptyComponent={renderEmptyComponent()}
      />
      
      {selectedDateId && (
        <CommentModal
          visible={commentModalVisible}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedDateId(null);
          }}
          onSubmitComment={handleSubmitComment}
          dateId={selectedDateId}
          personName={dates.find(d => d.id === selectedDateId)?.personName || ''}
          existingComments={dates.find(d => d.id === selectedDateId)?.comments?.map((c, idx) => ({
            id: `${selectedDateId}-${idx}`,
            name: c.name,
            content: c.content,
          })) || []}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  headerContent: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
