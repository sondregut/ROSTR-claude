import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Avatar } from '@/components/ui/Avatar';
import { MemberStatsCard } from '@/components/ui/cards/MemberStatsCard';
import { RosterPersonCard, type RosterPersonData } from '@/components/ui/cards/RosterPersonCard';
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock data - in real app, this would come from database
const MOCK_PROFILE_DATA = {
  'sarahc': {
    id: '1',
    name: 'Sarah Chen',
    username: 'sarahc',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Coffee addict, bookworm, and hopeless romantic looking for someone who can make me laugh until my sides hurt.',
    location: 'San Francisco, CA',
    joinedDate: 'Mar 2024',
    mutualCircles: ['Besties', 'College Crew'],
    stats: {
      totalDates: 18,
      activeDates: 3,
      averageRating: 4.1,
      datesThisMonth: 5,
    },
    datingRoster: [
      {
        id: '1',
        name: 'David',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        status: 'active' as const,
        lastDate: '2 days ago',
        totalDates: 4,
        averageRating: 4.3,
        nextDate: 'This weekend',
      },
      {
        id: '2',
        name: 'Marcus',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        status: 'new' as const,
        lastDate: '1 week ago',
        totalDates: 2,
        averageRating: 3.8,
      },
      {
        id: '3',
        name: 'James',
        avatar: 'https://randomuser.me/api/portraits/men/23.jpg',
        status: 'fading' as const,
        lastDate: '3 weeks ago',
        totalDates: 6,
        averageRating: 3.2,
      },
      {
        id: '4',
        name: 'Alex',
        avatar: 'https://randomuser.me/api/portraits/men/89.jpg',
        status: 'ended' as const,
        lastDate: '2 months ago',
        totalDates: 3,
        averageRating: 2.8,
      },
    ]
  },
  'mikej': {
    id: '2',
    name: 'Mike Johnson',
    username: 'mikej',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Adventure seeker and craft beer enthusiast. Looking for someone to explore the city with.',
    location: 'Portland, OR',
    joinedDate: 'Jan 2024',
    mutualCircles: ['Besties'],
    stats: {
      totalDates: 12,
      activeDates: 2,
      averageRating: 3.8,
      datesThisMonth: 3,
    },
    datingRoster: [
      {
        id: '1',
        name: 'Jessica',
        avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
        status: 'active' as const,
        lastDate: '1 week ago',
        totalDates: 5,
        averageRating: 4.0,
      },
      {
        id: '2',
        name: 'Amanda',
        avatar: 'https://randomuser.me/api/portraits/women/34.jpg',
        status: 'new' as const,
        lastDate: '3 days ago',
        totalDates: 1,
        averageRating: 4.5,
      },
    ]
  },
};

export default function MemberProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeTab, setActiveTab] = useState<'roster' | 'activity'>('roster');
  
  // Get profile data - in real app, this would be fetched from database
  const profileData = MOCK_PROFILE_DATA[username as keyof typeof MOCK_PROFILE_DATA] || MOCK_PROFILE_DATA['sarahc'];
  

  const handleMoreOptions = () => {
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
              <Text style={[styles.bio, { color: colors.text }]}>
                {profileData.bio}
              </Text>
              
              {/* Location and join date */}
              <View style={styles.metadata}>
                <View style={styles.metadataItem}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
                    {profileData.location}
                  </Text>
                </View>
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
              activeTab === 'activity' && [styles.activeTab, { backgroundColor: colors.background }]
            ]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'activity' ? colors.text : colors.textSecondary }
            ]}>
              Activity
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
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Activity feed coming soon...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});