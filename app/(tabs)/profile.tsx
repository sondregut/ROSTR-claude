import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Platform, 
  Pressable, 
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { ShareAppModal } from '@/components/ui/modals/ShareAppModal';
import { useUser } from '@/contexts/UserContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SupabaseTestButton } from '@/components/SupabaseTestButton';
import { uploadProfilePhoto } from '@/lib/photoUpload';
import { supabase } from '@/lib/supabase';
import { openInstagramProfile, getDisplayUsername } from '@/lib/instagramUtils';

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
    education: 'College+',
  },
  dealBreakers: ['Smoking', 'No sense of humor', 'Rude to service staff', 'Always late', 'Poor hygiene']
};


export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { userProfile, updateProfile, isLoading } = useUser();
  
  const [activeTab, setActiveTab] = useState<'about' | 'stats' | 'preferences'>('about');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async () => {
    if (!userProfile?.id) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      setIsUploadingPhoto(true);

      // Show action sheet to select photo source
      Alert.alert(
        'Select Photo',
        'Choose how you want to update your profile photo',
        [
          { text: 'Camera', onPress: () => uploadPhoto('camera') },
          { text: 'Photo Library', onPress: () => uploadPhoto('library') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      setIsUploadingPhoto(false);
      Alert.alert('Error', 'Failed to select photo source');
    }
  };

  const uploadPhoto = async (source: 'camera' | 'library') => {
    try {
      const userId = userProfile!.id || 'mock-user-id';
      const result = await uploadProfilePhoto(userId, source, {
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.success && result.url) {
        // For mock user, just update locally. For real users, update Supabase too
        if (userProfile!.id && userProfile!.id !== 'mock-user-id') {
          const { error } = await supabase
            .from('users')
            .update({ image_uri: result.url })
            .eq('id', userProfile!.id);

          if (error) {
            throw error;
          }
        }

        // Update local profile
        updateProfile({ imageUri: result.url });

        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to update profile photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };
  
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
            onPress={handlePhotoUpload}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="camera" size={12} color="white" />
            )}
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
              onPress={() => router.push('/profile/edit')}
            >
              <Ionicons name="pencil-outline" size={12} color={colors.text} />
              <Text style={[styles.compactButtonText, { color: colors.text }]}>Edit Profile</Text>
            </Pressable>
            <Pressable 
              style={[styles.compactButton, { borderColor: colors.border }]}
              onPress={() => setShareModalVisible(true)}
            >
              <Ionicons name="share-outline" size={12} color={colors.text} />
              <Text style={[styles.compactButtonText, { color: colors.text }]}>Share App</Text>
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
        </View>
        <Text style={[styles.bioText, { color: colors.text }]}>{userProfile.about.bio}</Text>
      </View>

      {/* Basic Info Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>
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

      {/* Social Media Section */}
      {userProfile.instagramUsername && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Social Media</Text>
          </View>
          <Pressable 
            style={styles.instagramButton}
            onPress={() => openInstagramProfile(userProfile.instagramUsername!)}
          >
            <Ionicons name="logo-instagram" size={20} color={colors.primary} />
            <Text style={[styles.instagramUsername, { color: colors.primary }]}>
              {getDisplayUsername(userProfile.instagramUsername)}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Interests Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
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
      
      {/* Supabase Test Button - Temporary for testing */}
      <SupabaseTestButton />
    </View>
  );

  const renderPreferencesTab = () => (
    <View style={styles.tabContent}>
      {/* Dating Preferences */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dating Preferences</Text>
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
          <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Education</Text>
          <Text style={[styles.preferenceValue, { color: colors.text }]}>{userProfile.preferences.dating.education}</Text>
        </View>
      </View>


      {/* Deal Breakers */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Deal Breakers</Text>
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


      {/* Share App Modal */}
      <ShareAppModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        userProfile={{
          name: userProfile.name,
          id: userProfile.id || 'user-id', // Use actual ID from profile or fallback
        }}
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
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  instagramUsername: {
    fontSize: 16,
    fontWeight: '500',
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