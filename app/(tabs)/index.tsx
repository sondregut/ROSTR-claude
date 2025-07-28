import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DateFeed } from '@/components/ui/feed/DateFeed';
import { CommentModal } from '@/components/ui/modals/CommentModal';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDates } from '@/contexts/DateContext';
import { useRouter } from 'expo-router';
import { getRosterIdFromPersonName } from '@/lib/rosterUtils';
import { generateHistoryUrl, hasRelationshipData } from '@/lib/relationshipData';

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const {
    dates,
    likeDate,
    addComment,
    voteOnPoll,
    refreshDates,
    isLoading
  } = useDates();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDates();
    } catch (error) {
      console.error('Error refreshing dates:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleLike = (dateId: string) => {
    likeDate(dateId);
  };
  
  const handleComment = (dateId: string) => {
    setSelectedDateId(dateId);
    setCommentModalVisible(true);
  };
  
  const handleSubmitComment = (text: string) => {
    if (!selectedDateId) return;
    
    addComment(selectedDateId, {
      name: 'You',
      content: text
    });
  };
  
  const handlePollVote = (dateId: string, optionIndex: number) => {
    voteOnPoll(dateId, optionIndex);
  };

  const handleAuthorPress = (authorName: string) => {
    // Navigate to the friend's profile who posted the update
    router.push(`/profile/${authorName.toLowerCase()}`);
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
        isRefreshing={isRefreshing || isLoading}
        onRefresh={handleRefresh}
        onDatePress={(dateId) => console.log(`Navigate to date detail ${dateId}`)}
        onPersonPress={(personName, authorName) => {
          if (authorName && authorName !== 'You') {
            // This is a friend's date - navigate to friend's view of this person
            router.push(`/person/${personName.toLowerCase()}?friendUsername=${authorName.toLowerCase()}&isOwnRoster=false`);
          } else {
            // This is your own date
            router.push(`/person/${personName.toLowerCase()}?isOwnRoster=true`);
          }
        }}
        onPersonHistoryPress={(personName, authorName) => {
          if (authorName && authorName !== 'You') {
            // Navigate to friend's date profile
            router.push(`/person/${personName.toLowerCase()}?friendUsername=${authorName.toLowerCase()}&isOwnRoster=false`);
          } else {
            // Navigate to your own roster
            router.push(`/person/${personName.toLowerCase()}?isOwnRoster=true`);
          }
        }}
        onAuthorPress={handleAuthorPress}
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
