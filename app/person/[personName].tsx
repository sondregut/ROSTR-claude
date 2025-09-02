import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Platform,
  Alert,
 Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SwipeableScreen } from '@/components/navigation/SwipeableScreen';
import { Button } from '@/components/ui/buttons/Button';
import { DateCard } from '@/components/ui/cards/DateCard';
import PlanCard from '@/components/ui/cards/PlanCard';
import { CommentModal } from '@/components/ui/modals/CommentModal';
import { AddPlanModal, PlanFormData } from '@/components/ui/modals/AddPlanModal';
import { EditDateModal } from '@/components/ui/modals/EditDateModal';
import { EditPlanModal } from '@/components/ui/modals/EditPlanModal';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDates } from '@/contexts/DateContext';
import { openInstagramProfile, getDisplayUsername } from '@/lib/instagramUtils';
import { useRoster } from '@/contexts/RosterContext';
import { useUser } from '@/contexts/UserContext';
import { RosterService } from '@/services/supabase/roster';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

type TabType = 'overview' | 'plans';

export default function UnifiedPersonDetailScreen() {
  const params = useLocalSearchParams();
  const personName = typeof params.personName === 'string' ? decodeURIComponent(params.personName) : '';
  const friendUsername = typeof params.friendUsername === 'string' ? decodeURIComponent(params.friendUsername) : undefined;
  const isOwnRoster = params.isOwnRoster === 'true';
  const rosterId = typeof params.rosterId === 'string' ? decodeURIComponent(params.rosterId) : undefined;
  const showEditOptions = params.showEditOptions === 'true';
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { dates, plans, addPlan, updatePlan, updateDate, deleteDate, likeDate, likePlan, addComment, addPlanComment } = useDates();
  const { activeRoster, pastConnections } = useRoster();
  const { userProfile } = useUser();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [selectedDateForEdit, setSelectedDateForEdit] = useState<any>(null);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<any>(null);
  const [friendRosterStatus, setFriendRosterStatus] = useState<string | null>(null);

  // Determine if viewing own roster or friend's date
  const viewingFriendDate = !!friendUsername;
  
  // Fetch friend's roster status for this person
  useEffect(() => {
    const fetchFriendRosterStatus = async () => {
      if (viewingFriendDate && friendUsername && personName) {
        try {
          const friendEntry = await RosterService.getFriendRosterEntry(
            friendUsername as string, 
            personName as string
          );
          if (friendEntry) {
            setFriendRosterStatus(friendEntry.status);
          } else {
            // Friend doesn't have this person in their roster
            console.log(`Person "${personName}" not found in ${friendUsername}'s roster`);
            setFriendRosterStatus(null);
          }
        } catch (error) {
          console.error('Error fetching friend roster status:', error);
          setFriendRosterStatus(null);
        }
      }
    };
    
    fetchFriendRosterStatus();
  }, [viewingFriendDate, friendUsername, personName]);
  
  // Get person data based on context
  let personData: any = null;
  let personDates: any[] = [];
  
  if (isOwnRoster === 'true') {
    // Viewing own roster - find by rosterId or personName
    const allRosterEntries = [...activeRoster, ...pastConnections];
    const rosterEntry = rosterId 
      ? allRosterEntries.find(e => e.id === rosterId)
      : allRosterEntries.find(e => e.name.toLowerCase() === (personName as string)?.toLowerCase());
    
    if (rosterEntry) {
      // Get dates for this person
      personDates = dates.filter(date => 
        date.personName.toLowerCase() === rosterEntry.name.toLowerCase() &&
        date.entryType !== 'roster_addition'
      );
      
      // Get plans for this person
      const personPlans = plans.filter(plan => 
        plan.personName.toLowerCase() === rosterEntry.name.toLowerCase()
      );
      
      // Calculate average rating from dates (excluding null ratings)
      const validRatingDates = personDates.filter(date => date.rating != null && date.rating > 0);
      const avgRating = validRatingDates.length > 0
        ? validRatingDates.reduce((sum, date) => sum + date.rating, 0) / validRatingDates.length
        : null;
      
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
        averageRating: avgRating !== null ? avgRating : (rosterEntry.rating || 0),
        lastDate: personDates[0]?.date || rosterEntry.lastDate,
        upcomingPlans: personPlans.filter(p => !p.isCompleted).length,
        notes: rosterEntry.notes || '',
        interests: rosterEntry.interests ? rosterEntry.interests.split(',').map(i => i.trim()) : [],
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
          authorName: date.authorName,
          authorAvatar: date.authorAvatar,
        })),
      };
    }
  } else if (viewingFriendDate && friendUsername) {
    // Viewing friend's date - check if we have this person in our own roster
    const allRosterEntries = [...activeRoster, ...pastConnections];
    const rosterEntry = allRosterEntries.find(e => e.name.toLowerCase() === (personName as string)?.toLowerCase());
    
    if (rosterEntry) {
      // We have this person in our roster too, show their profile
      personDates = dates.filter(date => 
        date.personName.toLowerCase() === rosterEntry.name.toLowerCase() && 
        date.authorName?.toLowerCase() === friendUsername.toLowerCase()
      );
      
      const personPlans = plans.filter(plan => 
        plan.personName.toLowerCase() === rosterEntry.name.toLowerCase()
      );
      
      const avgRating = personDates.length > 0
        ? personDates.reduce((sum, date) => sum + date.rating, 0) / personDates.length
        : 0;
      
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
        averageRating: avgRating !== null ? avgRating : (rosterEntry.rating || 0),
        lastDate: personDates[0]?.date || rosterEntry.lastDate,
        upcomingPlans: 0, // Don't show friend's plans
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
          authorName: date.authorName,
          authorAvatar: date.authorAvatar,
        })),
      };
    }
  } else {
    // Try to find the person in roster even without explicit flags
    const allRosterEntries = [...activeRoster, ...pastConnections];
    const rosterEntry = allRosterEntries.find(e => e.name.toLowerCase() === (personName as string)?.toLowerCase());
    
    if (rosterEntry) {
      // Found the person, treat as own roster view
      personDates = dates.filter(date => 
        date.personName.toLowerCase() === rosterEntry.name.toLowerCase() &&
        date.entryType !== 'roster_addition'
      );
      
      const personPlans = plans.filter(plan => 
        plan.personName.toLowerCase() === rosterEntry.name.toLowerCase()
      );
      
      const avgRating = personDates.length > 0
        ? personDates.reduce((sum, date) => sum + date.rating, 0) / personDates.length
        : 0;
      
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
        averageRating: avgRating !== null ? avgRating : (rosterEntry.rating || 0),
        lastDate: personDates[0]?.date || rosterEntry.lastDate,
        upcomingPlans: personPlans.filter(p => !p.isCompleted).length,
        notes: rosterEntry.notes || '',
        interests: rosterEntry.interests ? rosterEntry.interests.split(',').map(i => i.trim()) : [],
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
          authorName: date.authorName,
          authorAvatar: date.authorAvatar,
        })),
      };
    }
  }
  
  if (!personData) {
    const errorMessage = viewingFriendDate 
      ? `${friendUsername ? friendUsername.charAt(0).toUpperCase() + friendUsername.slice(1) : 'Your friend'} hasn't shared details about ${personName || 'this person'} yet`
      : 'Person not found';
    
    return (
      <SwipeableScreen swipeBackEnabled={true}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={styles.errorContainer}>
            <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
            <Pressable onPress={() => router.back()} style={[styles.backToFeedButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.backToFeedText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SwipeableScreen>
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
    likeDate(dateId);
  };

  const handleComment = (dateId: string) => {
    setSelectedDateId(dateId);
    setShowCommentModal(true);
  };

  const handleSubmitComment = async (text: string) => {
    if (selectedDateId) {
      try {
        await addComment(selectedDateId, {
          name: userProfile?.name || 'You',
          content: text
        });
        
        // Close modal on success
        setShowCommentModal(false);
        setSelectedDateId(null);
        
      } catch (error) {
        console.error('Error adding comment:', error);
        Alert.alert('Error', 'Failed to add comment. Please try again.');
      }
    } else if (selectedPlanId) {
      try {
        await addPlanComment(selectedPlanId, {
          name: userProfile?.name || 'You',
          content: text
        });
        
        // Close modal on success
        setShowCommentModal(false);
        setSelectedPlanId(null);
        
      } catch (error) {
        console.error('Error adding plan comment:', error);
        Alert.alert('Error', 'Failed to add comment. Please try again.');
      }
    }
  };

  const handleNavigateToDate = (dateId: string) => {
    // Navigate to full date view
    router.push(`/dates/${dateId}`);
  };

  const handleAddPlan = async (planData: PlanFormData) => {
    try {
      await addPlan(planData, personData.name);
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

  const handleEditPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlanForEdit(plan);
      setShowEditPlanModal(true);
    }
  };

  const handleLikePlan = (planId: string) => {
    likePlan(planId);
  };

  const handleCommentPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setShowCommentModal(true);
  };

  const handlePlanPersonPress = (personName: string) => {
    router.push(`/person/${personName.toLowerCase()}?isOwnRoster=true`);
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

  const handleSavePlanEdit = async (id: string, updates: Partial<any>) => {
    try {
      await updatePlan(id, updates);
      setShowEditPlanModal(false);
      setSelectedPlanForEdit(null);
    } catch (error) {
      console.error('Error updating plan:', error);
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

  const handleDeletePlan = async (id: string) => {
    try {
      await deletePlan(id);
      setShowEditPlanModal(false);
      setSelectedPlanForEdit(null);
    } catch (error) {
      console.error('Error deleting plan:', error);
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
    <SwipeableScreen swipeBackEnabled={true}>
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
          {/* Friend's view indicator */}
          {viewingFriendDate && friendRosterStatus && (
            <View style={[styles.friendViewBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
              <Ionicons name="people" size={16} color={colors.primary} />
              <Text style={[styles.friendViewText, { color: colors.primary }]}>
                Viewing {friendUsername}'s perspective of {personData.name}
              </Text>
            </View>
          )}
          
          {/* Main Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {personData.avatarUri ? (
                <OptimizedImage 
                  source={{ uri: personData.avatarUri }} 
                  style={styles.largeAvatar} 
                  priority="high"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.largeAvatar, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.mainPersonName, { color: colors.text }]}>{personData.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(friendRosterStatus || personData.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(friendRosterStatus || personData.status) }]}>
                    {(friendRosterStatus || personData.status).charAt(0).toUpperCase() + (friendRosterStatus || personData.status).slice(1)}
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
                    authorName={date.authorName}
                    authorAvatar={date.authorAvatar}
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
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onLike={() => handleLikePlan(plan.id)}
                      onComment={() => handleCommentPlan(plan.id)}
                      onAddDetails={() => handleCompletePlan(plan.id)}
                      onPersonPress={() => handlePlanPersonPress(plan.personName)}
                      onEdit={() => handleEditPlan(plan.id)}
                      showEditOptions={!viewingFriendDate}
                    />
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
      {(selectedDateId || selectedPlanId) && showCommentModal && (() => {
        if (selectedDateId) {
          const selectedDate = personDates.find(d => d.id === selectedDateId);
          if (!selectedDate) {
            return null;
          }
          
          return (
            <CommentModal
              visible={showCommentModal}
              onClose={() => {
                setShowCommentModal(false);
                setSelectedDateId(null);
              }}
              onSubmitComment={handleSubmitComment}
              dateId={selectedDateId}
              personName={selectedDate.personName || personData?.name || 'Unknown'}
              existingComments={selectedDate.comments?.map((c, idx) => ({
                id: `${selectedDateId}-${idx}`,
                name: c.name || 'Unknown',
                content: c.content || '',
              })) || []}
            />
          );
        } else if (selectedPlanId) {
          const selectedPlan = plans.find(p => p.id === selectedPlanId);
          if (!selectedPlan) {
            return null;
          }
          
          return (
            <CommentModal
              visible={showCommentModal}
              onClose={() => {
                setShowCommentModal(false);
                setSelectedPlanId(null);
              }}
              onSubmitComment={handleSubmitComment}
              dateId={selectedPlanId}
              personName={selectedPlan.personName || personData?.name || 'Unknown'}
              existingComments={selectedPlan.comments?.map((c, idx) => ({
                id: `${selectedPlanId}-${idx}`,
                name: c.name || 'Unknown',
                content: c.content || '',
              })) || []}
            />
          );
        }
        return null;
      })()}

      <AddPlanModal
        visible={showAddPlanModal}
        onClose={() => setShowAddPlanModal(false)}
        onSubmit={handleAddPlan}
        personName={personData.name}
      />

      <EditPlanModal
        visible={showEditPlanModal}
        plan={selectedPlanForEdit}
        onClose={() => {
          setShowEditPlanModal(false);
          setSelectedPlanForEdit(null);
        }}
        onSave={handleSavePlanEdit}
        onDelete={handleDeletePlan}
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
    </SwipeableScreen>
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
  friendViewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  friendViewText: {
    fontSize: 14,
    fontWeight: '500',
  },
});