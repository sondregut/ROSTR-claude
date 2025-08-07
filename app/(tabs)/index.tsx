import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateFeed } from '@/components/ui/feed/DateFeed';
import { EditDateModal } from '@/components/ui/modals/EditDateModal';
import { EditPlanModal } from '@/components/ui/modals/EditPlanModal';
import { EditRosterModal, RosterUpdateData } from '@/components/ui/modals/EditRosterModal';
import { Colors } from '@/constants/Colors';
import { useDates } from '@/contexts/DateContext';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useSafeUser } from '@/hooks/useSafeUser';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { NotificationBell } from '@/components/ui/notifications/NotificationBell';

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const auth = useSafeAuth();
  const user = useSafeUser();
  const signOut = auth?.signOut;
  const userProfile = user?.userProfile;
  
  const {
    dates,
    hasNewPosts,
    loadNewPosts,
    likeDate,
    likePlan,
    reactToDate,
    reactToPlan,
    addComment,
    addPlanComment,
    voteOnPoll,
    refreshDates,
    updateDate,
    updatePlan,
    deleteDate,
    deletePlan,
    updateRosterAddition,
    deleteRosterAddition,
    isLoading
  } = useDates();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDateForEdit, setSelectedDateForEdit] = useState<any>(null);
  const [editPlanModalVisible, setEditPlanModalVisible] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<any>(null);
  const [editRosterModalVisible, setEditRosterModalVisible] = useState(false);
  const [selectedRosterForEdit, setSelectedRosterForEdit] = useState<any>(null);
  
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
    console.log('🔍 Feed: handleLike called with dateId:', dateId);
    if (!likeDate) {
      console.error('❌ Feed: likeDate function not available from context');
      return;
    }
    likeDate(dateId);
  };

  const handleLikePlan = (planId: string) => {
    console.log('🔍 Feed: handleLikePlan called with planId:', planId);
    likePlan(planId);
  };

  const handleReact = (dateId: string, reaction: any) => {
    console.log('🔍 Feed: handleReact called with:', { dateId, reaction });
    if (!reactToDate) {
      console.error('❌ Feed: reactToDate function not available from context');
      return;
    }
    reactToDate(dateId, reaction);
  };

  const handleReactPlan = (planId: string, reaction: any) => {
    console.log('🔍 Feed: handleReactPlan called with:', { planId, reaction });
    if (!reactToPlan) {
      console.error('❌ Feed: reactToPlan function not available from context');
      return;
    }
    reactToPlan(planId, reaction);
  };
  
  const handleSubmitComment = async (dateId: string, text: string) => {
    try {
      await addComment(dateId, {
        name: userProfile?.name || 'You',
        content: text
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };
  
  const handleSubmitPlanComment = async (planId: string, text: string) => {
    try {
      await addPlanComment(planId, {
        name: userProfile?.name || 'You',
        content: text
      });
    } catch (error) {
      console.error('Error adding plan comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };
  
  const handlePollVote = (dateId: string, optionIndex: number) => {
    voteOnPoll(dateId, optionIndex);
  };

  const handleAuthorPress = (authorUsername: string) => {
    // Navigate to the friend's profile who posted the update
    if (authorUsername) {
      router.push(`/profile/${authorUsername}`);
    }
  };
  
  const handleEdit = (dateId: string) => {
    const date = dates.find(d => d.id === dateId);
    if (date) {
      setSelectedDateForEdit(date);
      setEditModalVisible(true);
    }
  };

  const handleEditPlan = (planId: string) => {
    const plan = dates.find(d => d.id === planId && d.entryType === 'plan');
    if (plan) {
      setSelectedPlanForEdit(plan);
      setEditPlanModalVisible(true);
    }
  };

  const handleEditRoster = (dateId: string) => {
    const rosterEntry = dates.find(d => d.id === dateId && d.entryType === 'roster_addition');
    if (rosterEntry) {
      setSelectedRosterForEdit(rosterEntry);
      setEditRosterModalVisible(true);
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

  const handleSavePlanEdit = async (id: string, updates: Partial<any>) => {
    try {
      await updatePlan(id, updates);
      setEditPlanModalVisible(false);
      setSelectedPlanForEdit(null);
    } catch (error) {
      console.error('Error updating plan:', error);
      Alert.alert('Error', 'Failed to update plan');
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

  const handleDeletePlan = async (id: string) => {
    try {
      await deletePlan(id);
      setEditPlanModalVisible(false);
      setSelectedPlanForEdit(null);
    } catch (error) {
      console.error('Error deleting plan:', error);
      Alert.alert('Error', 'Failed to delete plan');
    }
  };

  const handleSaveRosterEdit = async (id: string, updates: RosterUpdateData) => {
    try {
      await updateRosterAddition(id, updates);
      setEditRosterModalVisible(false);
      setSelectedRosterForEdit(null);
    } catch (error) {
      console.error('Error updating roster addition:', error);
      Alert.alert('Error', 'Failed to update roster entry');
    }
  };

  const handleDeleteRosterAddition = async (id: string) => {
    try {
      await deleteRosterAddition(id);
      setEditRosterModalVisible(false);
      setSelectedRosterForEdit(null);
    } catch (error) {
      console.error('Error deleting roster addition:', error);
      Alert.alert('Error', 'Failed to delete roster entry');
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
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Feed</Text>
        </View>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  console.log('🔍 Feed: Total dates loaded:', dates.length);
  console.log('🔍 Feed: Date IDs and names:', dates.map(d => ({ id: d.id, personName: d.personName, entryType: d.entryType })));

  if (dates.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Feed</Text>
        </View>
        {renderEmptyComponent()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Feed</Text>
        <NotificationBell size={24} />
      </View>
      
      {hasNewPosts && (
        <Pressable 
          style={[styles.newPostsIndicator, { backgroundColor: colors.primary }]}
          onPress={loadNewPosts}
        >
          <Ionicons name="arrow-up" size={16} color="white" />
          <Text style={styles.newPostsText}>New posts</Text>
        </Pressable>
      )}
      
      <DateFeed
        data={dates}
        isRefreshing={isRefreshing}
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
        onReact={handleReact}
        onSubmitComment={handleSubmitComment}
        onEdit={handleEdit}
        onEditRoster={handleEditRoster}
        onLikePlan={handleLikePlan}
        onReactPlan={handleReactPlan}
        onSubmitPlanComment={handleSubmitPlanComment}
        onEditPlan={handleEditPlan}
        onPollVote={handlePollVote}
        ListEmptyComponent={renderEmptyComponent()}
      />
      
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

      <EditPlanModal
        visible={editPlanModalVisible}
        plan={selectedPlanForEdit}
        onClose={() => {
          setEditPlanModalVisible(false);
          setSelectedPlanForEdit(null);
        }}
        onSave={handleSavePlanEdit}
        onDelete={handleDeletePlan}
      />

      <EditRosterModal
        visible={editRosterModalVisible}
        rosterEntry={selectedRosterForEdit}
        onClose={() => {
          setEditRosterModalVisible(false);
          setSelectedRosterForEdit(null);
        }}
        onSave={handleSaveRosterEdit}
        onDelete={handleDeleteRosterAddition}
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
  newPostsIndicator: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 6,
  },
  newPostsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
