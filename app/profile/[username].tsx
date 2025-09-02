import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Avatar } from '@/components/ui/Avatar';
import { MemberStatsCard } from '@/components/ui/cards/MemberStatsCard';
import { RosterPersonCard, type RosterPersonData } from '@/components/ui/cards/RosterPersonCard';
import { DateCard } from '@/components/ui/cards/DateCard';
import PlanCard from '@/components/ui/cards/PlanCard';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserService } from '@/services/supabase/users';
import { FriendsService } from '@/services/supabase/friends';
import { FriendRequestService } from '@/services/FriendRequestService';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface ProfileData {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedDate: string;
  mutualCircles: string[];
  stats: {
    totalDates: number;
    activeDates: number;
    averageRating: number;
    datesThisMonth: number;
  };
  datingRoster: RosterPersonData[];
  dateHistory: any[];
  futureDates: any[];
}

export default function MemberProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'roster' | 'dates' | 'future'>('roster');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'friends' | 'pending_sent' | 'pending_received' | 'none'>('none');
  
  // Load profile data from database
  useEffect(() => {
    const loadProfileData = async () => {
      if (!username || typeof username !== 'string') {
        console.error('❌ Profile: Invalid username provided:', username);
        setError('Invalid username');
        setIsLoading(false);
        return;
      }

      if (username.trim() === '') {
        console.error('❌ Profile: Empty username provided');
        setError('Username cannot be empty');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get user profile by username
        console.log('🔍 Profile: Looking up user with username:', username);
        const userProfile = await UserService.getUserByUsername(username);
        
        if (!userProfile) {
          console.error('❌ Profile: User not found for username:', username);
          setError('User not found');
          setIsLoading(false);
          return;
        }

        console.log('✅ Profile: Found user:', userProfile.name, 'username:', userProfile.username);

        // Check friendship status FIRST if user is logged in
        let currentFriendshipStatus: 'friends' | 'pending_sent' | 'pending_received' | 'none' = 'none';
        let areActualFriends = false;
        
        if (user?.id && user.id !== userProfile.id) {
          currentFriendshipStatus = await FriendRequestService.getFriendshipStatus(userProfile.id);
          areActualFriends = currentFriendshipStatus === 'friends';
          console.log('🔍 Profile Debug - Other user:', userProfile.username, 'Friendship Status:', currentFriendshipStatus, 'Are Friends:', areActualFriends);
        } else if (user?.id === userProfile.id) {
          // User viewing their own profile - allow full access
          areActualFriends = true;
          currentFriendshipStatus = 'friends';
          console.log('🔍 Profile Debug - Own profile:', userProfile.username, 'Full access granted');
        }
        
        setFriendshipStatus(currentFriendshipStatus);
        setIsFriend(areActualFriends);

        // Create minimal profile with only name and username for non-friends
        if (!areActualFriends) {
          const minimalProfile: ProfileData = {
            id: userProfile.id,
            name: userProfile.name,
            username: userProfile.username,
            avatar: undefined, // Hide avatar for non-friends
            bio: '', // Hide bio
            location: '', // Hide location
            joinedDate: '', // Hide join date
            mutualCircles: [], // Hide mutual circles
            stats: {
              totalDates: 0,
              activeDates: 0,
              averageRating: 0,
              datesThisMonth: 0,
            },
            datingRoster: [],
            dateHistory: [],
            futureDates: [],
          };
          
          setProfileData(minimalProfile);
          setIsLoading(false);
          return;
        }

        // Only load full data for friends
        const roster = await UserService.getUserRoster(userProfile.id);
        const dateHistory = await UserService.getUserDateHistory(userProfile.id);
        const futureDates = await UserService.getUserFutureDates(userProfile.id);
        const sharedCircles = await UserService.getSharedCircles(userProfile.id, user?.id || '');
        
        // Transform roster data
        const transformedRoster: RosterPersonData[] = roster.map(person => ({
          id: person.id,
          name: person.name,
          avatar: person.photos?.[0] || '',
          age: person.age,
          occupation: person.occupation,
          tags: [],
          status: 'active' as const,
          lastDate: person.last_date,
          rating: person.rating || 0,
          dateCount: person.date_count || 0,
        }));
        
        // Calculate stats
        const stats = {
          totalDates: dateHistory.length,
          activeDates: roster.filter(r => r.status === 'active').length,
          averageRating: dateHistory.reduce((acc, d) => acc + (d.rating || 0), 0) / (dateHistory.length || 1),
          datesThisMonth: dateHistory.filter(d => {
            const dateTime = new Date(d.created_at);
            const now = new Date();
            return dateTime.getMonth() === now.getMonth() && dateTime.getFullYear() === now.getFullYear();
          }).length,
        };
        
        const profile: ProfileData = {
          id: userProfile.id,
          name: userProfile.name,
          username: userProfile.username,
          avatar: userProfile.image_uri,
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          joinedDate: new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          mutualCircles: sharedCircles.map(c => c.name),
          stats,
          datingRoster: transformedRoster,
          dateHistory,
          futureDates,
        };

        setProfileData(profile);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [username]);

  const handleUnfriend = async () => {
    if (!profileData || !user?.id) return;
    
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${profileData.name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Friend',
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendsService.removeFriend(user.id, profileData.id);
              setIsFriend(false);
              Alert.alert('Success', `${profileData.name} has been removed from your friends`);
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleAddFriend = async () => {
    if (!profileData || !user?.id) return;
    
    try {
      await FriendRequestService.sendFriendRequest(profileData.id);
      setFriendshipStatus('pending_sent');
      Alert.alert('Success', `Friend request sent to ${profileData.name}`);
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async () => {
    if (!profileData || !user?.id) return;
    
    try {
      console.log('Profile: Attempting to accept friend request from:', profileData.id);
      const success = await FriendRequestService.acceptFriendRequest(profileData.id);
      
      if (success) {
        setFriendshipStatus('friends');
        setIsFriend(true);
        Alert.alert('Success', `You are now friends with ${profileData.name}`, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to accept friend request. Please try again.');
      }
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      const errorMessage = error.message || 'Failed to accept friend request';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeclineRequest = async () => {
    if (!profileData || !user?.id) return;
    
    Alert.alert(
      'Decline Friend Request',
      `Are you sure you want to decline ${profileData.name}'s friend request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Profile: Attempting to decline friend request from:', profileData.id);
              const success = await FriendRequestService.rejectFriendRequest(profileData.id);
              
              if (success) {
                setFriendshipStatus('none');
                Alert.alert('Request declined');
              } else {
                Alert.alert('Error', 'Failed to decline friend request. Please try again.');
              }
            } catch (error: any) {
              console.error('Error declining friend request:', error);
              const errorMessage = error.message || 'Failed to decline friend request';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleRetractRequest = async () => {
    if (!profileData || !user?.id) return;
    
    Alert.alert(
      'Cancel Friend Request',
      `Are you sure you want to cancel your friend request to ${profileData.name}?`,
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await FriendRequestService.cancelFriendRequest(profileData.id);
              if (success) {
                setFriendshipStatus('none');
                Alert.alert('Request Cancelled', `Friend request to ${profileData.name} has been cancelled`);
              } else {
                Alert.alert('Error', 'Failed to cancel friend request');
              }
            } catch (error) {
              console.error('Error cancelling friend request:', error);
              Alert.alert('Error', 'Failed to cancel friend request');
            }
          },
        },
      ]
    );
  };

  const handleMoreOptions = () => {
    if (!profileData) return;
    
    const options = [
      ...(isFriend ? [{ text: 'Unfriend', onPress: handleUnfriend, style: 'destructive' as const }] : []),
      ...(friendshipStatus === 'pending_sent' ? [{ text: 'Retract Friend Request', onPress: handleRetractRequest, style: 'destructive' as const }] : []),
      { text: 'Block User', style: 'destructive' as const },
      { text: 'Report User', style: 'destructive' as const },
      { text: 'Cancel', style: 'cancel' as const },
    ];
    
    Alert.alert(
      profileData.name,
      'Choose an action',
      options
    );
  };

  const handlePersonPress = (person: RosterPersonData) => {
    // Navigate to person detail screen for friend's roster entry
    router.push(`/person/${encodeURIComponent(person.name.toLowerCase())}?friendUsername=${encodeURIComponent(profileData.username)}&isOwnRoster=false`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profileData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error || 'User not found'}</Text>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={[styles.navBar, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          
          <View style={styles.navCenter}>
            <Text style={[styles.navTitle, { color: colors.text }]}>{profileData.name}</Text>
            <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>
              @{profileData.username}
            </Text>
          </View>
          
          <Pressable onPress={handleMoreOptions} style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Profile Header */}
        <View style={[styles.profileHeader, { 
          backgroundColor: colors.card,
          borderColor: colors.border,
        }]}>
          <View style={styles.profileInfo}>
            {isFriend ? (
              <Avatar
                uri={profileData.avatar}
                name={profileData.name}
                size={80}
              />
            ) : (
              <View style={[styles.restrictedAvatar, { backgroundColor: colors.textSecondary }]}>
                <Ionicons name="person" size={40} color="white" />
              </View>
            )}
            
            <View style={styles.profileDetails}>
              {isFriend && profileData.mutualCircles.length > 0 && (
                <View style={[styles.mutualCircles, styles.mutualCirclesTop]}>
                  {profileData.mutualCircles.map((circle, index) => (
                    <View key={index} style={[styles.circleTag, { backgroundColor: colors.tagBackground }]}>
                      <Text style={[styles.circleTagText, { color: colors.tagText }]}>
                        {circle}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {isFriend && profileData.bio && (
                <Text style={[styles.bio, { color: colors.text }]}>
                  {profileData.bio}
                </Text>
              )}
              
              {!isFriend && (
                <View style={styles.privacyNotice}>
                  <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                    {friendshipStatus === 'pending_sent' && 'Friend request sent'}
                    {friendshipStatus === 'pending_received' && 'Wants to be your friend'}
                    {friendshipStatus === 'none' && 'Connect to view profile'}
                  </Text>
                </View>
              )}
              
              {isFriend && (
                <View style={styles.metadata}>
                  {profileData.location && (
                    <View style={styles.metadataItem}>
                      <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
                        {profileData.location}
                      </Text>
                    </View>
                  )}
                  <View style={styles.metadataItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
                      Joined {profileData.joinedDate}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          
          {/* Friendship Action Buttons */}
          {!isFriend && user?.id && user.id !== profileData.id && (
            <View style={styles.friendshipActions}>
              {friendshipStatus === 'none' && (
                <Pressable
                  style={[styles.friendshipButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddFriend}
                >
                  <Ionicons name="person-add" size={18} color="white" />
                  <Text style={styles.friendshipButtonText}>Add Friend</Text>
                </Pressable>
              )}
              
              {friendshipStatus === 'pending_sent' && (
                <View style={[styles.friendshipButton, styles.pendingButton, { backgroundColor: colors.textSecondary }]}>
                  <Ionicons name="time" size={18} color="white" />
                  <Text style={styles.friendshipButtonText}>Request Sent</Text>
                </View>
              )}
              
              {friendshipStatus === 'pending_received' && (
                <View style={styles.friendshipButtonGroup}>
                  <Pressable
                    style={[styles.friendshipButton, styles.acceptButton, { backgroundColor: colors.primary }]}
                    onPress={handleAcceptRequest}
                  >
                    <Ionicons name="checkmark" size={18} color="white" />
                    <Text style={styles.friendshipButtonText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.friendshipButton, styles.declineButton, { backgroundColor: colors.textSecondary }]}
                    onPress={handleDeclineRequest}
                  >
                    <Ionicons name="close" size={18} color="white" />
                    <Text style={styles.friendshipButtonText}>Decline</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Member Stats - Only for friends */}
        {isFriend && <MemberStatsCard stats={profileData.stats} />}

        {/* Tabs - Only for friends */}
        {isFriend && (
        <>
        <View style={[styles.tabs, { 
          backgroundColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'roster' && [styles.activeTab, { backgroundColor: colors.background }]
            ]}
            onPress={() => setActiveTab('roster')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'roster' ? colors.text : colors.textSecondary },
              styles.tabTextEllipsis
            ]} numberOfLines={1}>
              Roster ({profileData.datingRoster.length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'dates' && [styles.activeTab, { backgroundColor: colors.background }]
            ]}
            onPress={() => setActiveTab('dates')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'dates' ? colors.text : colors.textSecondary },
              styles.tabTextEllipsis
            ]} numberOfLines={1}>
              Recent ({profileData.dateHistory.length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'future' && [styles.activeTab, { backgroundColor: colors.background }]
            ]}
            onPress={() => setActiveTab('future')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'future' ? colors.text : colors.textSecondary },
              styles.tabTextEllipsis
            ]} numberOfLines={1}>
              Future ({profileData.futureDates.length})
            </Text>
          </Pressable>
        </View>
        
        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'roster' ? (
            <View>
              <View style={styles.rosterHeader}>
                <Text style={[styles.rosterTitle, { color: colors.text }]}>
                  Dating Roster
                </Text>
                <Text style={[styles.rosterSubtitle, { color: colors.textSecondary }]}>
                  {profileData.datingRoster.filter(p => p.status === 'active' || p.status === 'new').length} active
                </Text>
              </View>
              
              {profileData.datingRoster.map((person, index) => (
                <RosterPersonCard
                  key={person.id}
                  person={person}
                  ownerName={profileData.name}
                  onPress={() => handlePersonPress(person)}
                />
              ))}
              
              {profileData.datingRoster.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {profileData.name} hasn't shared any dating updates yet.
                  </Text>
                </View>
              )}
            </View>
          ) : activeTab === 'dates' ? (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recent Date History
                </Text>
              </View>
              
              {profileData.dateHistory.map((date) => (
                <DateCard
                  key={date.id}
                  id={date.id}
                  personName={date.person_name}
                  date={new Date(date.created_at).toLocaleDateString()}
                  location={date.location}
                  rating={date.rating}
                  notes={date.notes}
                  imageUri={date.image_uri}
                  tags={date.tags || []}
                  authorName={profileData.name}
                  authorAvatar={profileData.avatar}
                  likeCount={date.like_count}
                  commentCount={date.comment_count}
                  isLiked={false}
                  onPersonPress={() => router.push(`/person/${date.person_name.toLowerCase()}?friendUsername=${profileData.username}&isOwnRoster=false`)}
                  onPersonHistoryPress={() => router.push(`/person/${date.person_name.toLowerCase()}?friendUsername=${profileData.username}&isOwnRoster=false`)}
                />
              ))}
              
              {profileData.dateHistory.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {profileData.name} hasn't shared any dates yet.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Upcoming Dates
                </Text>
              </View>
              
              {profileData.futureDates.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={{
                    id: plan.id,
                    personName: plan.person_name,
                    date: new Date(plan.date).toLocaleDateString(),
                    rawDate: plan.date,
                    time: plan.time,
                    location: plan.location,
                    content: plan.notes,
                    tags: plan.tags || [],
                    authorName: profileData.name,
                    authorAvatar: profileData.avatar,
                    createdAt: plan.created_at,
                    isCompleted: plan.is_completed,
                    likeCount: 0,
                    commentCount: 0,
                    isLiked: false,
                    comments: [],
                  }}
                  onLike={() => {}}
                  onPersonPress={() => router.push(`/person/${plan.person_name.toLowerCase()}?friendUsername=${profileData.username}&isOwnRoster=false`)}
                />
              ))}
              
              {profileData.futureDates.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {profileData.name} has no upcoming dates.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        </>
        )}

        {/* Privacy Notice for Non-Friends */}
        {!isFriend && (
          <View style={[styles.privacyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="lock-closed" size={32} color={colors.textSecondary} />
            <Text style={[styles.privacyTitle, { color: colors.text }]}>Profile Protected</Text>
            <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>
              This user's profile is private. Connect as friends to view their dating activity, roster, and stats.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60, // Add top padding for status bar
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  navSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  profileHeader: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 16,
  },
  mutualCircles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mutualCirclesTop: {
    marginTop: 0, // No top margin since name/username removed
  },
  circleTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  circleTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bio: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  metadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextEllipsis: {
    flexShrink: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rosterTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  rosterSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  restrictedAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyNotice: {
    marginTop: 8,
  },
  privacyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  friendshipActions: {
    marginTop: 16,
    alignItems: 'center',
  },
  friendshipButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  friendshipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  friendshipButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
  },
  declineButton: {
    flex: 1,
  },
  pendingButton: {
    opacity: 0.7,
  },
  privacyContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  privacyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});