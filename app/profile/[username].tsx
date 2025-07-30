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
  
  // Load profile data from database
  useEffect(() => {
    const loadProfileData = async () => {
      if (!username || typeof username !== 'string') {
        setError('Invalid username');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Get user profile by username
        const userProfile = await UserService.getUserByUsername(username);
        
        if (!userProfile) {
          setError('User not found');
          setIsLoading(false);
          return;
        }

        // Load roster data
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

  const handleMoreOptions = () => {
    if (!profileData) return;
    
    Alert.alert(
      profileData.name,
      'Choose an action',
      [
        { text: 'Block User', style: 'destructive' },
        { text: 'Report User', style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePersonPress = (person: RosterPersonData) => {
    // Navigate to roster person detail screen
    router.push(`/roster/${person.name.toLowerCase()}?isOwnRoster=false`);
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
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={styles.profileInfo}>
            <Avatar
              uri={profileData.avatar}
              name={profileData.name}
              size={80}
            />
            
            <View style={styles.profileDetails}>
              {/* Mutual Circles */}
              {profileData.mutualCircles.length > 0 && (
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
              
              {/* Bio */}
              {profileData.bio && (
                <Text style={[styles.bio, { color: colors.text }]}>
                  {profileData.bio}
                </Text>
              )}
              
              {/* Location and join date */}
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
            </View>
          </View>
          
        </View>

        {/* Member Stats */}
        <MemberStatsCard stats={profileData.stats} />

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.border }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'roster' && [styles.activeTab, { backgroundColor: colors.background }]
            ]}
            onPress={() => setActiveTab('roster')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'roster' ? colors.text : colors.textSecondary }
            ]}>
              Dating Roster ({profileData.datingRoster.length})
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
              { color: activeTab === 'dates' ? colors.text : colors.textSecondary }
            ]}>
              Recent Dates ({profileData.dateHistory.length})
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
              { color: activeTab === 'future' ? colors.text : colors.textSecondary }
            ]}>
              Future Dates ({profileData.futureDates.length})
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
    marginTop: 8,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    marginBottom: 16,
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
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
});