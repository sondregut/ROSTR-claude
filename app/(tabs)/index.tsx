import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DateFeed } from '@/components/ui/feed/DateFeed';
import { CommentModal } from '@/components/ui/modals/CommentModal';
import { EditDateModal } from '@/components/ui/modals/EditDateModal';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDates } from '@/contexts/DateContext';
import { useRouter } from 'expo-router';
import { getRosterIdFromPersonName } from '@/lib/rosterUtils';
import { generateHistoryUrl, hasRelationshipData } from '@/lib/relationshipData';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Alert, Pressable } from 'react-native';

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { signOut } = useAuth();
  
  const {
    dates,
    likeDate,
    addComment,
    voteOnPoll,
    refreshDates,
    updateDate,
    deleteDate,
    isLoading
  } = useDates();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDateForEdit, setSelectedDateForEdit] = useState<any>(null);
  
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

  // Temporary sign out for development
  const handleDevSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'This will sign you out and restart the onboarding flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
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
  
  const handleEdit = (dateId: string) => {
    const date = dates.find(d => d.id === dateId);
    if (date) {
      setSelectedDateForEdit(date);
      setEditModalVisible(true);
    }
  };
  
  const handleSaveEdit = async (id: string, updates: Partial<any>) => {
    try {
      await updateDate(id, updates);
      setEditModalVisible(false);
      setSelectedDateForEdit(null);
    } catch (error) {
      console.error('Error updating date:', error);
      Alert.alert('Error', 'Failed to update date');
    }
  };
  
  const handleDeleteDate = async (id: string) => {
    try {
      await deleteDate(id);
      setEditModalVisible(false);
      setSelectedDateForEdit(null);
    } catch (error) {
      console.error('Error deleting date:', error);
      Alert.alert('Error', 'Failed to delete date');
    }
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
        {/* Temporary sign out button for development */}
        <Pressable 
          onPress={handleDevSignOut}
          style={styles.devSignOutButton}
        >
          <Text style={[styles.devSignOutText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>
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
        onEdit={handleEdit}
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
      
      <EditDateModal
        visible={editModalVisible}
        date={selectedDateForEdit}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedDateForEdit(null);
        }}
        onSave={handleSaveEdit}
        onDelete={handleDeleteDate}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  devSignOutButton: {
    padding: 8,
  },
  devSignOutText: {
    fontSize: 14,
    fontWeight: '600',
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
