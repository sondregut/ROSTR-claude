import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  useColorScheme, 
  Platform, 
  Pressable, 
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { EditProfileModal } from '@/components/ui/modals/EditProfileModal';
import { AboutMeEditForm } from '@/components/ui/forms/profile/AboutMeEditForm';
import { BasicInfoEditForm } from '@/components/ui/forms/profile/BasicInfoEditForm';
import { InterestsEditForm } from '@/components/ui/forms/profile/InterestsEditForm';
import { DatingPreferencesEditForm } from '@/components/ui/forms/profile/DatingPreferencesEditForm';
import { LifestyleEditForm } from '@/components/ui/forms/profile/LifestyleEditForm';
import { DealBreakersEditForm } from '@/components/ui/forms/profile/DealBreakersEditForm';
import { useUser } from '@/contexts/UserContext';

// Mock user data matching specification
const MOCK_USER = {
  name: 'Jamie Smith',
  username: '@jamiesmith',
  bio: 'Coffee enthusiast, hiking lover, and always up for trying new restaurants. Looking for someone who can make me laugh and shares my love for adventure.',
  location: 'New York, NY',
  occupation: 'Marketing Manager',
  age: 28,
  imageUri: 'https://randomuser.me/api/portraits/women/68.jpg',
  stats: {
    totalDates: 12,
    activeConnections: 4,
    avgRating: 3.8,
    circles: 5,
  }
};

// Mock data for About tab
const MOCK_ABOUT = {
  interests: ['Coffee', 'Hiking', 'Photography', 'Cooking', 'Travel', 'Art', 'Music', 'Fitness'],
  connectedApps: [
    { id: 'tinder', name: 'Tinder', isConnected: true, icon: '🔴' },
    { id: 'hinge', name: 'Hinge', isConnected: false, icon: '🔵' },
    { id: 'bumble', name: 'Bumble', isConnected: false, icon: '🟣' },
  ]
};

// Mock data for Stats tab
const MOCK_STATS = {
  avgRating: 3.8,
  firstDateRating: 3.5,
  secondDateRating: 4.2,
  datesThisMonth: 12,
  monthTrend: 3,
  successRate: 85,
  mostUsedTags: [
    { tag: 'Great conversation', count: 8 },
    { tag: 'Chemistry', count: 6 },
    { tag: 'Funny', count: 5 },
    { tag: 'Potential', count: 3 },
  ],
  longestConnections: [
    { id: '1', name: 'Alex', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', dates: 6 },
    { id: '2', name: 'Taylor', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', dates: 4 },
  ]
};

// Mock data for Preferences tab
const MOCK_PREFERENCES = {
  dating: {
    lookingFor: 'Serious Relationship',
    ageRange: '25-35',
    distance: 'Within 25 miles',
    education: 'College+',
  },
  lifestyle: {
    drinking: 'Socially',
    smoking: 'Never',
    exercise: 'Regularly',
    diet: 'No restrictions',
  },
  dealBreakers: ['Smoking', 'No sense of humor', 'Rude to service staff', 'Always late', 'Poor hygiene']
};

type EditModalType = 'about' | 'basicInfo' | 'interests' | 'dating' | 'lifestyle' | 'dealBreakers' | null;

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { userProfile, updateProfile, isLoading } = useUser();
  
  const [activeTab, setActiveTab] = useState<'about' | 'stats' | 'preferences'>('about');
  const [editModal, setEditModal] = useState<EditModalType>(null);
  
  if (isLoading || !userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderProfileHeader = () => (
    <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
      {/* Horizontal Layout Container */}
      <View style={styles.profileTopSection}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Image 
            source={{ uri: userProfile.imageUri }} 
            style={styles.profileImage}
          />
          <Pressable 
            style={[styles.cameraButton, { backgroundColor: colors.primary }]}
            onPress={() => console.log('Change photo')}
          >
            <Ionicons name="camera" size={12} color="white" />
          </Pressable>
        </View>

        {/* Info and Actions Section */}
        <View style={styles.profileInfoSection}>
          {/* Identity Display */}
          <Text style={[styles.profileName, { color: colors.text }]}>{userProfile.name}</Text>
          <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>{userProfile.username}</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.compactButton, { borderColor: colors.border }]}
              onPress={() => console.log('Edit profile')}
            >
              <Ionicons name="pencil-outline" size={12} color={colors.text} />
              <Text style={[styles.compactButtonText, { color: colors.text }]}>Edit Profile</Text>
            </Pressable>
            <Pressable 
              style={[styles.compactButton, { borderColor: colors.border }]}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={12} color={colors.text} />
              <Text style={[styles.compactButtonText, { color: colors.text }]}>Settings</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{userProfile.stats.totalDates}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dates</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{userProfile.stats.activeConnections}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{userProfile.stats.avgRating}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{userProfile.stats.circles}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Circles</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabs, { backgroundColor: colors.card }]}>
      <Pressable
        style={styles.tab}
        onPress={() => setActiveTab('about')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'about' ? colors.primary : colors.textSecondary }
        ]}>
          About
        </Text>
        {activeTab === 'about' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
      </Pressable>
      <Pressable
        style={styles.tab}
        onPress={() => setActiveTab('stats')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'stats' ? colors.primary : colors.textSecondary }
        ]}>
          Stats
        </Text>
        {activeTab === 'stats' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
      </Pressable>
      <Pressable
        style={styles.tab}
        onPress={() => setActiveTab('preferences')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'preferences' ? colors.primary : colors.textSecondary }
        ]}>
          Preferences
        </Text>
        {activeTab === 'preferences' && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
      </Pressable>
    </View>
  );

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* About Me Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
          <Pressable onPress={() => setEditModal('about')}>
            <Ionicons name="pencil" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[styles.bioText, { color: colors.text }]}>{userProfile.about.bio}</Text>
      </View>

      {/* Basic Info Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>
          <Pressable onPress={() => setEditModal('basicInfo')}>
            <Ionicons name="pencil" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{userProfile.location}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{userProfile.occupation}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{userProfile.age} years old</Text>
        </View>
      </View>

      {/* Interests Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
          <Pressable onPress={() => setEditModal('interests')}>
            <Ionicons name="pencil" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.interestTags}>
          {userProfile.about.interests.map((interest, index) => (
            <View key={index} style={[styles.interestTag, { backgroundColor: colors.border }]}>
              <Text style={[styles.interestText, { color: colors.text }]}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>

    </View>
  );

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      {/* Average Rating Card */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={[styles.statCardTitle, { color: colors.text }]}>Average Rating</Text>
        </View>
        <Text style={[styles.largeStatValue, { color: colors.primary }]}>{MOCK_STATS.avgRating}</Text>
        <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>out of 5</Text>
        <View style={styles.statBreakdown}>
          <Text style={[styles.breakdownText, { color: colors.textSecondary }]}>
            First dates: {MOCK_STATS.firstDateRating}
          </Text>
          <Text style={[styles.breakdownText, { color: colors.textSecondary }]}>
            Second dates: {MOCK_STATS.secondDateRating}
          </Text>
        </View>
      </View>

      {/* Dating Activity Card */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statEmoji}>📅</Text>
          <Text style={[styles.statCardTitle, { color: colors.text }]}>Dating Activity</Text>
        </View>
        <Text style={[styles.largeStatValue, { color: colors.primary }]}>{MOCK_STATS.datesThisMonth}</Text>
        <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>dates this month</Text>
        <Text style={[styles.trendText, { color: colors.statusActive }]}>
          +{MOCK_STATS.monthTrend} from last month
        </Text>
      </View>

      {/* Success Rate Card */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={[styles.statCardTitle, { color: colors.text }]}>Success Rate</Text>
        </View>
        <Text style={[styles.largeStatValue, { color: colors.primary }]}>{MOCK_STATS.successRate}%</Text>
        <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>Second date rate</Text>
        <Text style={[styles.successText, { color: colors.statusActive }]}>Above average</Text>
      </View>

      {/* Most-used Tags */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={[styles.statCardTitle, { color: colors.text }]}>Most-used Tags</Text>
        </View>
        {MOCK_STATS.mostUsedTags.map((item, index) => (
          <View key={index} style={styles.tagStatItem}>
            <Text style={[styles.tagName, { color: colors.text }]}>{item.tag}</Text>
            <Text style={[styles.tagCount, { color: colors.textSecondary }]}>{item.count}</Text>
          </View>
        ))}
      </View>

      {/* Longest Connections */}
      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statEmoji}>❤️</Text>
          <Text style={[styles.statCardTitle, { color: colors.text }]}>Longest Connections</Text>
        </View>
        {MOCK_STATS.longestConnections.map((connection) => (
          <View key={connection.id} style={styles.connectionItem}>
            <Image source={{ uri: connection.avatar }} style={styles.connectionAvatar} />
            <Text style={[styles.connectionName, { color: colors.text }]}>{connection.name}</Text>
            <Text style={[styles.connectionDates, { color: colors.textSecondary }]}>{connection.dates} dates</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPreferencesTab = () => (
    <View style={styles.tabContent}>
      {/* Dating Preferences */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dating Preferences</Text>
          <Pressable onPress={() => setEditModal('dating')}>
            <Ionicons name="pencil" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Looking for</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.dating.lookingFor}</Text>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Age range</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.dating.ageRange}</Text>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Distance</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.dating.distance}</Text>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Education</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.dating.education}</Text>
        </View>
      </View>

      {/* Lifestyle Preferences */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Lifestyle</Text>
          <Pressable onPress={() => setEditModal('lifestyle')}>
            <Ionicons name="pencil" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Drinking</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.lifestyle.drinking}</Text>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Smoking</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.lifestyle.smoking}</Text>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Exercise</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.lifestyle.exercise}</Text>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Diet</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.lifestyle.diet}</Text>
        </View>
      </View>

      {/* Deal Breakers */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Deal Breakers</Text>
          <Pressable onPress={() => setEditModal('dealBreakers')}>
            <Ionicons name="pencil" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.dealBreakerTags}>
          {userProfile.preferences.dealBreakers.map((item, index) => (
            <View key={index} style={[styles.dealBreakerTag, { borderColor: colors.border }]}>
              <Text style={[styles.dealBreakerText, { color: colors.text }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
        </View>

        {/* Profile Header */}
        {renderProfileHeader()}

        {/* Tabs */}
        {renderTabs()}

        {/* Tab Content */}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
      </ScrollView>

      {/* Edit Modals */}
      {editModal === 'about' && (
        <EditProfileModal
          visible={true}
          onClose={() => setEditModal(null)}
          onSave={() => {
            // Save is handled via onChange in the form
            setEditModal(null);
          }}
          title="Edit About Me"
        >
          <AboutMeEditForm
            initialBio={userProfile.about.bio}
            onChange={(bio) => {
              updateProfile({
                about: { ...userProfile.about, bio },
                bio, // Also update the top-level bio for consistency
              });
            }}
          />
        </EditProfileModal>
      )}

      {editModal === 'basicInfo' && (
        <EditProfileModal
          visible={true}
          onClose={() => setEditModal(null)}
          onSave={() => setEditModal(null)}
          title="Edit Basic Info"
        >
          <BasicInfoEditForm
            initialInfo={{
              location: userProfile.location,
              occupation: userProfile.occupation,
              age: userProfile.age,
            }}
            onChange={(info) => {
              updateProfile(info);
            }}
          />
        </EditProfileModal>
      )}

      {editModal === 'interests' && (
        <EditProfileModal
          visible={true}
          onClose={() => setEditModal(null)}
          onSave={() => setEditModal(null)}
          title="Edit Interests"
        >
          <InterestsEditForm
            initialInterests={userProfile.about.interests}
            onChange={(interests) => {
              updateProfile({
                about: { ...userProfile.about, interests },
              });
            }}
          />
        </EditProfileModal>
      )}

      {editModal === 'dating' && (
        <EditProfileModal
          visible={true}
          onClose={() => setEditModal(null)}
          onSave={() => setEditModal(null)}
          title="Dating Preferences"
        >
          <DatingPreferencesEditForm
            initialPreferences={userProfile.preferences.dating}
            onChange={(dating) => {
              updateProfile({
                preferences: { ...userProfile.preferences, dating },
              });
            }}
          />
        </EditProfileModal>
      )}

      {editModal === 'lifestyle' && (
        <EditProfileModal
          visible={true}
          onClose={() => setEditModal(null)}
          onSave={() => setEditModal(null)}
          title="Lifestyle Preferences"
        >
          <LifestyleEditForm
            initialLifestyle={userProfile.preferences.lifestyle}
            onChange={(lifestyle) => {
              updateProfile({
                preferences: { ...userProfile.preferences, lifestyle },
              });
            }}
          />
        </EditProfileModal>
      )}

      {editModal === 'dealBreakers' && (
        <EditProfileModal
          visible={true}
          onClose={() => setEditModal(null)}
          onSave={() => setEditModal(null)}
          title="Deal Breakers"
        >
          <DealBreakersEditForm
            initialDealBreakers={userProfile.preferences.dealBreakers}
            onChange={(dealBreakers) => {
              updateProfile({
                preferences: { ...userProfile.preferences, dealBreakers },
              });
            }}
          />
        </EditProfileModal>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileHeader: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarSection: {
    position: 'relative',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfoSection: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileUsername: {
    fontSize: 14,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 20,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 3,
    borderRadius: 2,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 14,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIcon: {
    fontSize: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
  },
  statCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 20,
  },
  statCardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  largeStatValue: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 16,
    marginBottom: 12,
  },
  statBreakdown: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  breakdownText: {
    fontSize: 14,
    marginBottom: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tagName: {
    fontSize: 16,
  },
  tagCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  connectionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  connectionName: {
    fontSize: 16,
    flex: 1,
  },
  connectionDates: {
    fontSize: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 16,
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  dealBreakerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dealBreakerTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dealBreakerText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});