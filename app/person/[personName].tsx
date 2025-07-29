import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { DateCard } from '@/components/ui/cards/DateCard';
import { CommentModal } from '@/components/ui/modals/CommentModal';
import { AddPlanModal, PlanFormData } from '@/components/ui/modals/AddPlanModal';
import { EditDateModal } from '@/components/ui/modals/EditDateModal';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDates } from '@/contexts/DateContext';
import { openInstagramProfile, getDisplayUsername } from '@/lib/instagramUtils';
import { useRoster } from '@/contexts/RosterContext';

type TabType = 'overview' | 'match' | 'plans';

export default function UnifiedPersonDetailScreen() {
  const { personName, friendUsername, isOwnRoster, rosterId, showEditOptions } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { dates, plans, addPlan, updatePlan, updateDate, deleteDate } = useDates();
  const { activeRoster, pastConnections } = useRoster();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDateForEdit, setSelectedDateForEdit] = useState<any>(null);

  // Determine if viewing own roster or friend's date
  const viewingFriendDate = !!friendUsername;
  
  // Get person data based on context
  let personData: any = null;
  
  if (isOwnRoster === 'true' && rosterId) {
    // Viewing own roster
    const allRosterEntries = [...activeRoster, ...pastConnections];
    const rosterEntry = allRosterEntries.find(e => e.id === rosterId);
    
    if (rosterEntry) {
      // Get dates for this person
      const personDates = dates.filter(date => 
        date.personName.toLowerCase() === rosterEntry.name.toLowerCase()
      );
      
      // Get plans for this person
      const personPlans = plans.filter(plan => 
        plan.personName.toLowerCase() === rosterEntry.name.toLowerCase()
      );
      
      // Calculate average rating from dates
      const avgRating = personDates.length > 0
        ? personDates.reduce((sum, date) => sum + date.rating, 0) / personDates.length
        : 0;
      
      // Convert roster entry to person data format
      personData = {
        name: rosterEntry.name,
        age: rosterEntry.age || 0,
        occupation: rosterEntry.occupation || '',
        location: rosterEntry.location || '',
        howWeMet: rosterEntry.how_we_met || '',
        avatarUri: rosterEntry.photos?.[0] || personDates[0]?.imageUri || null,
        instagramUsername: rosterEntry.instagram || personDates[0]?.instagramUsername || '',
        status: rosterEntry.status,
        totalDates: personDates.length,
        averageRating: avgRating || rosterEntry.rating,
        lastDate: personDates[0]?.date || rosterEntry.lastDate,
        upcomingPlans: personPlans.filter(p => !p.isCompleted).length,
        notes: rosterEntry.notes || '',
        interests: rosterEntry.interests ? rosterEntry.interests.split(',').map(i => i.trim()) : [],
        compatibility: {
          communication: 0,
          humor: 0,
          values: 0,
          physical: 0,
          lifestyle: 0,
        },
        dateHistory: personDates.map(date => ({
          id: date.id,
          personName: date.personName,
          date: date.date,
          location: date.location,
          rating: date.rating,
          notes: date.notes,
          tags: date.tags,
          instagramUsername: date.instagramUsername,
          imageUri: date.imageUri,
          likeCount: date.likeCount,
          commentCount: date.commentCount,
          isLiked: date.isLiked,
          comments: date.comments,
          poll: date.poll,
        })),
      };
    }
  } else if (viewingFriendDate && friendUsername) {
    // Viewing friend's date - TODO: Implement friend data sharing
    personData = null;
  } else {
    // No fallback - real data only
    personData = null;
  }
  
  if (!personData) {
    const errorMessage = viewingFriendDate 
      ? `${friendUsername ? friendUsername.charAt(0).toUpperCase() + friendUsername.slice(1) : 'Your friend'} hasn't shared details about ${personName || 'this person'} yet`
      : 'Person not found';
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
          <Pressable onPress={() => router.back()} style={[styles.backToFeedButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.backToFeedText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.statusActive;
      case 'new': return colors.statusNew;
      case 'fading': return colors.statusFading;
      case 'ended': return colors.statusEnded;
      default: return colors.textSecondary;
    }
  };

  const getStatusBgColor = (status: string) => {
    return getStatusColor(status) + '20';
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 8) return colors.statusActive;
    if (score >= 6) return colors.statusNew;
    return colors.statusFading;
  };

  const handleLike = (dateId: string) => {
    // Handle like functionality
    console.log('Like date:', dateId);
  };

  const handleComment = (dateId: string) => {
    setSelectedDateId(dateId);
    setShowCommentModal(true);
  };

  const handleSubmitComment = (comment: string) => {
    if (selectedDateId) {
      // Handle comment submission
      console.log('Submit comment:', comment, 'for date:', selectedDateId);
    }
    setShowCommentModal(false);
    setSelectedDateId(null);
  };

  const handleNavigateToDate = (dateId: string) => {
    // Navigate to full date view
    router.push(`/dates/${dateId}`);
  };

  const handleAddPlan = async (planData: PlanFormData) => {
    try {
      await addPlan(planData);
      setShowAddPlanModal(false);
    } catch (error) {
      console.error('Error adding plan:', error);
    }
  };

  const handleCompletePlan = async (planId: string) => {
    try {
      await updatePlan(planId, { isCompleted: true });
    } catch (error) {
      console.error('Error completing plan:', error);
    }
  };

  const handleNavigateToPlan = (planId: string) => {
    router.push(`/plans/${planId}`);
  };

  const handleEditDate = (dateId: string) => {
    const date = dates.find(d => d.id === dateId);
    if (date) {
      setSelectedDateForEdit(date);
      setShowEditModal(true);
    }
  };
  
  const handleSaveEdit = async (id: string, updates: Partial<any>) => {
    try {
      await updateDate(id, updates);
      setShowEditModal(false);
      setSelectedDateForEdit(null);
    } catch (error) {
      console.error('Error updating date:', error);
    }
  };
  
  const handleDeleteDate = async (id: string) => {
    try {
      await deleteDate(id);
      setShowEditModal(false);
      setSelectedDateForEdit(null);
    } catch (error) {
      console.error('Error deleting date:', error);
    }
  };

  const getStatusMessage = () => {
    if (viewingFriendDate) return '';
    
    switch (personData.status) {
      case 'active':
        return "Things are going well! 💚";
      case 'new':
        return "Just getting started! ✨";
      case 'fading':
        return "Things might be cooling off 💛";
      case 'ended':
        return "This connection has ended 💔";
      case 'ghosted':
        return "They disappeared 👻";
      default:
        return "";
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{personData.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Consolidated Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Main Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {personData.avatarUri ? (
                <Image source={{ uri: personData.avatarUri }} style={styles.largeAvatar} />
              ) : (
                <View style={[styles.largeAvatar, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.mainPersonName, { color: colors.text }]}>{personData.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(personData.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(personData.status) }]}>
                    {personData.status.charAt(0).toUpperCase() + personData.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              {personData.instagramUsername && (
                <Pressable 
                  onPress={() => openInstagramProfile(personData.instagramUsername)}
                  style={[styles.instagramButton, { backgroundColor: colors.border }]}
                >
                  <Ionicons name="logo-instagram" size={14} color={colors.primary} />
                  <Text style={[styles.instagramUsername, { color: colors.primary }]}>
                    {getDisplayUsername(personData.instagramUsername)}
                  </Text>
                </Pressable>
              )}
              
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{personData.totalDates}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>dates</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {personData.averageRating.toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>avg rating</Text>
                </View>
                {personData.upcomingPlans > 0 && (
                  <>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.text }]}>{personData.upcomingPlans}</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>plans</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Basic Info Grid */}
          <View style={styles.infoGrid}>
            {personData.age > 0 && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{personData.age} years old</Text>
              </View>
            )}
            {personData.occupation && (
              <View style={styles.infoItem}>
                <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{personData.occupation}</Text>
              </View>
            )}
            {personData.location && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{personData.location}</Text>
              </View>
            )}
            {personData.howWeMet && (
              <View style={styles.infoItem}>
                <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>Met: {personData.howWeMet}</Text>
              </View>
            )}
          </View>

          {/* Notes Section */}
          {personData.notes && (
            <View style={styles.notesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <Text style={[styles.notesText, { color: colors.text }]}>{personData.notes}</Text>
            </View>
          )}

          {/* Interests */}
          {(personData.interests || []).length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
              <View style={styles.interestsList}>
                {(personData.interests || []).map((interest, index) => (
                  <View key={index} style={[styles.interestChip, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.interestText, { color: colors.primary }]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'overview' ? colors.primary : colors.textSecondary }
            ]}>
              Date History ({(personData.dateHistory || []).length})
            </Text>
            {activeTab === 'overview' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
          </Pressable>
          
          {Object.keys(personData.compatibility || {}).length > 0 && (
            <Pressable
              style={[styles.tab, activeTab === 'match' && styles.activeTab]}
              onPress={() => setActiveTab('match')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'match' ? colors.primary : colors.textSecondary }
              ]}>
                Compatibility
              </Text>
              {activeTab === 'match' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
            </Pressable>
          )}
          
          {!viewingFriendDate && (
            <Pressable
              style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
              onPress={() => setActiveTab('plans')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'plans' ? colors.primary : colors.textSecondary }
              ]}>
                Plans ({plans.filter(p => p.personName === personData.name && !p.isCompleted).length})
              </Text>
              {activeTab === 'plans' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
            </Pressable>
          )}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View style={styles.dateHistorySection}>
              {(personData.dateHistory || []).length > 0 ? (
                (personData.dateHistory || []).map((date) => (
                  <DateCard
                    key={date.id}
                    id={date.id}
                    personName={date.personName}
                    date={date.date}
                    location={date.location}
                    rating={date.rating}
                    notes={date.notes}
                    imageUri={date.imageUri}
                    tags={date.tags}
                    instagramUsername={date.instagramUsername}
                    isOwnPost={!viewingFriendDate}
                    poll={date.poll}
                    userPollVote={null}
                    comments={date.comments}
                    onPress={() => handleNavigateToDate(date.id)}
                    onLike={() => handleLike(date.id)}
                    onComment={() => handleComment(date.id)}
                    onEdit={(!viewingFriendDate || showEditOptions === 'true') ? () => handleEditDate(date.id) : undefined}
                    onPollVote={(dateId, optionIndex) => console.log('Vote:', dateId, optionIndex)}
                    likeCount={date.likeCount}
                    commentCount={date.commentCount}
                    isLiked={date.isLiked}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    No dates recorded yet
                  </Text>
                  {!viewingFriendDate && (
                    <Button
                      title="Add First Date"
                      variant="primary"
                      onPress={() => router.push('/update')}
                      style={styles.emptyStateButton}
                    />
                  )}
                </View>
              )}
            </View>
          )}

          {activeTab === 'match' && Object.keys(personData.compatibility || {}).length > 0 && (
            <View style={styles.compatibilitySection}>
              {Object.entries(personData.compatibility || {}).map(([category, score]) => (
                <View key={category} style={styles.compatibilityItem}>
                  <View style={styles.compatibilityHeader}>
                    <Text style={[styles.compatibilityCategory, { color: colors.text }]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    <Text style={[styles.compatibilityScore, { color: getCompatibilityColor(score) }]}>
                      {score.toFixed(1)}
                    </Text>
                  </View>
                  <View style={[styles.compatibilityBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.compatibilityFill,
                        {
                          width: `${(score / 10) * 100}%`,
                          backgroundColor: getCompatibilityColor(score),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
              
              {getStatusMessage() && (
                <View style={[styles.statusMessageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statusMessageText, { color: colors.text }]}>
                    {getStatusMessage()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'plans' && !viewingFriendDate && (
            <View style={styles.plansSection}>
              <Button
                title="Add New Plan"
                variant="primary"
                onPress={() => setShowAddPlanModal(true)}
                style={styles.addPlanButton}
                icon="add"
              />
              
              {plans.filter(p => p.personName === personData.name && !p.isCompleted).length > 0 ? (
                plans
                  .filter(p => p.personName === personData.name && !p.isCompleted)
                  .map((plan) => (
                    <Pressable
                      key={plan.id}
                      style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => handleNavigateToPlan(plan.id)}
                    >
                      <View style={styles.planHeader}>
                        <View style={styles.planInfo}>
                          <Text style={[styles.planActivity, { color: colors.text }]}>{plan.activity}</Text>
                          <Text style={[styles.planDate, { color: colors.textSecondary }]}>{plan.date}</Text>
                        </View>
                        <Pressable
                          style={[styles.completePlanButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleCompletePlan(plan.id)}
                        >
                          <Ionicons name="checkmark" size={20} color="white" />
                        </Pressable>
                      </View>
                      {plan.notes && (
                        <Text style={[styles.planNotes, { color: colors.text }]} numberOfLines={2}>
                          {plan.notes}
                        </Text>
                      )}
                      <View style={styles.planFooter}>
                        <View style={styles.planStats}>
                          <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.planStatText, { color: colors.textSecondary }]}>
                            {plan.likeCount}
                          </Text>
                          <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                          <Text style={[styles.planStatText, { color: colors.textSecondary }]}>
                            {plan.commentCount}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    No upcoming plans
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                    Add a plan to keep track of future dates
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <CommentModal
        visible={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        onSubmit={handleSubmitComment}
      />

      <AddPlanModal
        visible={showAddPlanModal}
        onClose={() => setShowAddPlanModal(false)}
        onSave={handleAddPlan}
        preselectedPerson={personData.name}
      />
      
      <EditDateModal
        visible={showEditModal}
        date={selectedDateForEdit}
        onClose={() => {
          setShowEditModal(false);
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileSection: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  mainPersonName: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  instagramUsername: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 6,
  },
  notesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  interestsSection: {
    marginTop: 8,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styles handled by text color and indicator
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  tabContent: {
    flex: 1,
    paddingBottom: 16,
  },
  dateHistorySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    minWidth: 150,
  },
  compatibilitySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  compatibilityItem: {
    marginBottom: 20,
  },
  compatibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compatibilityCategory: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  compatibilityScore: {
    fontSize: 16,
    fontWeight: '600',
  },
  compatibilityBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  compatibilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusMessageCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusMessageText: {
    fontSize: 16,
    textAlign: 'center',
  },
  plansSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addPlanButton: {
    marginBottom: 16,
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planInfo: {
    flex: 1,
  },
  planActivity: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  planDate: {
    fontSize: 14,
  },
  completePlanButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planStatText: {
    fontSize: 14,
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backToFeedButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backToFeedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});