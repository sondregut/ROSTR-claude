import React, { useState , useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Platform, 
  Pressable, 
  Alert,
  ActivityIndicator,
  InteractionManager,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { ShareAppModal } from '@/components/ui/modals/ShareAppModal';
import { useSafeUser } from '@/hooks/useSafeUser';
import { useColorScheme } from '@/hooks/useColorScheme';
import { pickImageWithCrop, uploadImageToSupabase } from '@/lib/photoUpload';
import { supabase } from '@/lib/supabase';
import { openInstagramProfile, getDisplayUsername } from '@/lib/instagramUtils';
import { MiniBarChart } from '@/components/ui/charts/MiniBarChart';
import { ProgressRing } from '@/components/ui/charts/ProgressRing';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { logger } from '@/utils/logger';
import { OptimizedImage } from '@/components/ui/OptimizedImage';



export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const user = useSafeUser();
  const userProfile = user?.userProfile;
  const updateProfile = user?.updateProfile;
  const detailedStats = user?.detailedStats;
  const loadDetailedStats = user?.loadDetailedStats;
  const isLoading = user?.isLoading || false;
  const isLoadingStats = user?.isLoadingStats || false;
  
  // Prefetch image if available
  useEffect(() => {
    if (userProfile?.imageUri && userProfile.imageUri.trim() !== '' && userProfile.imageUri.startsWith('http')) {
      logger.debug('[Profile] Prefetching image:', userProfile.imageUri);
      Image.prefetch(userProfile.imageUri)
        .catch((error) => {
          logger.error('[Profile] Image prefetch failed:', error);
        });
    }
  }, [userProfile]);
  
  const [activeTab, setActiveTab] = useState<'about' | 'stats' | 'preferences'>('about');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Use lifecycle hook to manage operations
  const { runAfterInteractions } = useAppLifecycle({
    onBackground: () => {
      // Cancel any ongoing uploads when app goes to background
      if (isUploadingPhoto) {
        setIsUploadingPhoto(false);
      }
    }
  });

  // Load detailed stats when stats tab is selected
  useEffect(() => {
    if (activeTab === 'stats' && !detailedStats && !isLoadingStats && loadDetailedStats) {
      // Defer stats loading to avoid blocking UI
      runAfterInteractions(() => {
        loadDetailedStats();
      });
    }
  }, [activeTab, detailedStats, isLoadingStats, loadDetailedStats, runAfterInteractions]);

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
      
      // Run photo upload after interactions to prevent blocking
      InteractionManager.runAfterInteractions(async () => {
        try {
          const result = await pickImageWithCrop(source, {
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
            maxWidth: 800,
            maxHeight: 800,
          });

          if (result.success && result.uri) {
            const localUri = result.uri;
            
            // For real users, upload to Supabase storage
            if (userProfile!.id && userProfile!.id !== 'mock-user-id') {
              // Show loading immediately with local URI
              updateProfile({ imageUri: localUri });
              
              // Upload to Supabase storage
              const uploadResult = await uploadImageToSupabase(
                localUri,
                userProfile!.id,
                'user-photos'
              );

              if (uploadResult.success && uploadResult.url) {
                // Update database with Supabase URL
                const { error } = await supabase
                  .from('users')
                  .update({ image_uri: uploadResult.url })
                  .eq('id', userProfile!.id);

                if (error) {
                  throw error;
                }

                // Update local profile with Supabase URL
                logger.info('[Profile] Updating profile with Supabase URL:', uploadResult.url);
                updateProfile({ imageUri: uploadResult.url });
              } else {
                // Upload failed, keep using local URI as fallback
                logger.error('[Profile] Upload to Supabase failed:', uploadResult.error);
                Alert.alert(
                  'Upload Warning',
                  'Photo saved locally but could not upload to cloud. It may be lost if you reinstall the app.',
                  [{ text: 'OK' }]
                );
                
                // Still update database with local URI as fallback
                const { error } = await supabase
                  .from('users')
                  .update({ image_uri: localUri })
                  .eq('id', userProfile!.id);

                if (error) {
                  throw error;
                }
              }
            } else {
              // Mock user - just use local URI
              updateProfile({ imageUri: localUri });
            }
          } else if (result.error && result.error !== 'Selection cancelled') {
            Alert.alert('Error', `Failed to pick image: ${result.error}`);
          }
        } catch (error) {
          logger.error('[Profile] Photo upload error:', error);
          Alert.alert('Error', 'Failed to update profile photo');
        } finally {
          setIsUploadingPhoto(false);
        }
      });
    } catch (error) {
      // Handle any errors setting up the interaction
      logger.error('[Profile] Failed to setup photo upload:', error);
      Alert.alert('Error', 'Failed to start photo upload');
      setIsUploadingPhoto(false);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Profile Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Please try logging in again
          </Text>
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
          <View>
            {userProfile.imageUri && userProfile.imageUri.trim() !== '' ? (
              <OptimizedImage 
                source={{ uri: userProfile.imageUri }}
                style={styles.profileImage}
                priority="high"
                enableRetry={true}
                maxRetries={3}
                showFallback={true}
                onLoad={() => {
                  logger.debug('[Profile] Image loaded successfully');
                }}
                onError={(error: any) => {
                  logger.error('[Profile] Image error:', error);
                }}
              />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
              </View>
            )}
          </View>
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
          <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{userProfile.email}</Text>
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

  const renderStatsTab = () => {
    if (isLoadingStats) {
      return (
        <View style={[styles.tabContent, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading stats...</Text>
        </View>
      );
    }

    // Validate that we have the required data
    if (!userProfile || !user) {
      return (
        <View style={[styles.tabContent, styles.loadingContainer]}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your profile...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Average Rating Card */}
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={[styles.statCardTitle, { color: colors.text }]}>Average Rating</Text>
          </View>
          <Text style={[styles.largeStatValue, { color: colors.primary }]}>{userProfile.stats.avgRating}</Text>
          <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>out of 5</Text>
          {detailedStats && (
            <View style={styles.statBreakdown}>
              <Text style={[styles.breakdownText, { color: colors.textSecondary }]}>
                First dates: {detailedStats.firstDateAvgRating || 'N/A'}
              </Text>
              <Text style={[styles.breakdownText, { color: colors.textSecondary }]}>
                Second dates: {detailedStats.secondDateAvgRating || 'N/A'}
              </Text>
            </View>
          )}
        </View>

        {/* Dating Activity Card */}
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={[styles.statCardTitle, { color: colors.text }]}>Dating Activity</Text>
          </View>
          <Text style={[styles.largeStatValue, { color: colors.primary }]}>
            {detailedStats?.datesThisMonth || 0}
          </Text>
          <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>dates this month</Text>
          {detailedStats && detailedStats.datesLastMonth > 0 && (
            <Text style={[styles.trendText, { 
              color: detailedStats.datesThisMonth > detailedStats.datesLastMonth 
                ? colors.statusActive 
                : colors.textSecondary 
            }]}>
              {detailedStats.datesThisMonth > detailedStats.datesLastMonth ? '↑' : '↓'} 
              {' '}{Math.abs(detailedStats.datesThisMonth - detailedStats.datesLastMonth)} from last month
            </Text>
          )}
        </View>

        {/* Success Rate Card */}
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statEmoji}>👥</Text>
            <Text style={[styles.statCardTitle, { color: colors.text }]}>Success Rate</Text>
          </View>
          <View style={styles.progressRingContainer}>
            <ProgressRing 
              percentage={detailedStats?.secondDateRate || 0} 
              size={100}
              strokeWidth={10}
            />
          </View>
          <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>Second date rate</Text>
          {detailedStats && detailedStats.secondDateRate > 0 && (
            <Text style={[styles.successText, { 
              color: detailedStats.secondDateRate >= 30 ? colors.statusActive : colors.textSecondary 
            }]}>
              {detailedStats.secondDateRate >= 30 ? 'Above average' : 'Building connections'}
            </Text>
          )}
        </View>

        {/* Most-used Tags */}
        {detailedStats && detailedStats.mostUsedTags.length > 0 && (
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={[styles.statCardTitle, { color: colors.text }]}>Most-used Tags</Text>
            </View>
            {detailedStats.mostUsedTags.map((item, index) => (
              <View key={index} style={styles.tagStatItem}>
                <Text style={[styles.tagName, { color: colors.text }]}>{item.tag}</Text>
                <Text style={[styles.tagCount, { color: colors.textSecondary }]}>{item.usage_count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Longest Connections */}
        {detailedStats && detailedStats.longestConnections.length > 0 && (
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statEmoji}>❤️</Text>
              <Text style={[styles.statCardTitle, { color: colors.text }]}>Longest Connections</Text>
            </View>
            {detailedStats.longestConnections.map((connection, index) => (
              <View key={index} style={styles.connectionItem}>
                <View style={[styles.connectionAvatar, { backgroundColor: colors.border }]}>
                  <Text style={[styles.connectionInitial, { color: colors.text }]}>
                    {connection.person_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.connectionName, { color: colors.text }]}>{connection.person_name}</Text>
                <Text style={[styles.connectionDates, { color: colors.textSecondary }]}>
                  {connection.date_count} dates
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Dating Trends */}
        {detailedStats && detailedStats.datingTrends.length > 0 && (
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statEmoji}>📈</Text>
              <Text style={[styles.statCardTitle, { color: colors.text }]}>Dating Trends</Text>
            </View>
            <MiniBarChart
              data={detailedStats.datingTrends.slice(0, 6).reverse().map(trend => ({
                label: trend.month_year.split(' ')[0].substring(0, 3),
                value: trend.date_count
              }))}
              height={120}
            />
            <View style={styles.trendSummary}>
              <Text style={[styles.trendSummaryText, { color: colors.textSecondary }]}>
                Last 6 months • Avg {Math.round(
                  detailedStats.datingTrends.slice(0, 6).reduce((sum, t) => sum + t.date_count, 0) / 
                  Math.min(6, detailedStats.datingTrends.length)
                )} dates/month
              </Text>
            </View>
          </View>
        )}

        {/* Dating Personality Card */}
        {detailedStats && (
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statEmoji}>🎭</Text>
              <Text style={[styles.statCardTitle, { color: colors.text }]}>Your Dating Personality</Text>
            </View>
            <Text style={[styles.personalityType, { color: colors.primary }]}>
              {detailedStats.personality.type}
            </Text>
            <Text style={[styles.personalityDescription, { color: colors.text }]}>
              {detailedStats.personality.description}
            </Text>
            <View style={styles.personalityTraits}>
              <View style={[styles.trait, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.traitText, { color: colors.primary }]}>
                  {detailedStats.personality.primaryTrait}
                </Text>
              </View>
              <View style={[styles.trait, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.traitText, { color: colors.primary }]}>
                  {detailedStats.personality.secondaryTrait}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Dating Streaks */}
        {detailedStats && (
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={[styles.statCardTitle, { color: colors.text }]}>Dating Streaks</Text>
            </View>
            <View style={styles.streakContainer}>
              <View style={styles.streakItem}>
                <Text style={[styles.streakValue, { color: colors.primary }]}>
                  {detailedStats.streaks.currentStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                  Current week{detailedStats.streaks.currentStreak !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakItem}>
                <Text style={[styles.streakValue, { color: colors.primary }]}>
                  {detailedStats.streaks.longestStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                  Best streak
                </Text>
              </View>
            </View>
            <View style={styles.consistencyBar}>
              <View style={[styles.consistencyProgress, { 
                backgroundColor: colors.primary,
                width: `${detailedStats.streaks.consistencyScore}%`
              }]} />
            </View>
            <Text style={[styles.consistencyText, { color: colors.textSecondary }]}>
              {detailedStats.streaks.consistencyScore}% consistency
            </Text>
          </View>
        )}

        {/* Time & Day Patterns */}
        {detailedStats && (
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statEmoji}>⏰</Text>
              <Text style={[styles.statCardTitle, { color: colors.text }]}>Dating Patterns</Text>
            </View>
            <Text style={[styles.patternHighlight, { color: colors.text }]}>
              Your favorite day is <Text style={{ color: colors.primary }}>{detailedStats.datingPatterns.mostPopularDay}</Text>
            </Text>
            <View style={styles.timeDistribution}>
              <View style={styles.timeSlot}>
                <Ionicons name="sunny" size={24} color={colors.primary} />
                <Text style={[styles.timeSlotLabel, { color: colors.text }]}>Morning</Text>
                <Text style={[styles.timeSlotValue, { color: colors.textSecondary }]}>
                  {detailedStats.datingPatterns.morningDates}
                </Text>
              </View>
              <View style={styles.timeSlot}>
                <Ionicons name="partly-sunny" size={24} color={colors.primary} />
                <Text style={[styles.timeSlotLabel, { color: colors.text }]}>Afternoon</Text>
                <Text style={[styles.timeSlotValue, { color: colors.textSecondary }]}>
                  {detailedStats.datingPatterns.afternoonDates}
                </Text>
              </View>
              <View style={styles.timeSlot}>
                <Ionicons name="moon" size={24} color={colors.primary} />
                <Text style={[styles.timeSlotLabel, { color: colors.text }]}>Evening</Text>
                <Text style={[styles.timeSlotValue, { color: colors.textSecondary }]}>
                  {detailedStats.datingPatterns.eveningDates}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Location Insights */}
        {detailedStats && detailedStats.locationStats.uniqueLocations > 0 && (
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statEmoji}>📍</Text>
              <Text style={[styles.statCardTitle, { color: colors.text }]}>Location Insights</Text>
            </View>
            <View style={styles.locationHighlight}>
              <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Favorite spot</Text>
              <Text style={[styles.locationName, { color: colors.primary }]}>
                {detailedStats.locationStats.topLocation}
              </Text>
              <Text style={[styles.locationVisits, { color: colors.textSecondary }]}>
                {detailedStats.locationStats.topLocationCount} visits • {detailedStats.locationStats.topLocationRating}/5 avg
              </Text>
            </View>
            {detailedStats.locationStats.mostSuccessfulLocation !== detailedStats.locationStats.topLocation && (
              <View style={[styles.locationHighlight, { marginTop: 12 }]}>
                <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>Most successful</Text>
                <Text style={[styles.locationName, { color: colors.primary }]}>
                  {detailedStats.locationStats.mostSuccessfulLocation}
                </Text>
                <Text style={[styles.locationVisits, { color: colors.textSecondary }]}>
                  {detailedStats.locationStats.mostSuccessfulRating}/5 avg rating
                </Text>
              </View>
            )}
            <View style={styles.locationDiversity}>
              <Text style={[styles.diversityText, { color: colors.text }]}>
                You've explored {detailedStats.locationStats.uniqueLocations} unique locations
              </Text>
              <Text style={[styles.diversityScore, { color: colors.primary }]}>
                {detailedStats.locationStats.locationDiversityScore}% diversity
              </Text>
            </View>
          </View>
        )}

        {/* Achievements & Comparisons */}
        {detailedStats && (
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={styles.statCardHeader}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={[styles.statCardTitle, { color: colors.text }]}>Achievements</Text>
            </View>
            <View style={[styles.achievementBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.achievementTitle, { color: colors.primary }]}>
                {detailedStats.achievements.uniqueAchievement}
              </Text>
            </View>
            <View style={styles.comparisonStats}>
              <Text style={[styles.comparisonText, { color: colors.text }]}>
                You date more than <Text style={{ color: colors.primary }}>{Math.round(detailedStats.achievements.datesRankPercentile)}%</Text> of users
              </Text>
              <Text style={[styles.comparisonText, { color: colors.text }]}>
                Your ratings are higher than <Text style={{ color: colors.primary }}>{Math.round(detailedStats.achievements.ratingRankPercentile)}%</Text> of users
              </Text>
            </View>
            {detailedStats.achievements.perfectDatesCount > 0 && (
              <View style={styles.perfectDates}>
                <Text style={styles.perfectEmoji}>⭐⭐⭐⭐⭐</Text>
                <Text style={[styles.perfectText, { color: colors.text }]}>
                  {detailedStats.achievements.perfectDatesCount} perfect dates!
                </Text>
              </View>
            )}
            <Text style={[styles.momentumText, { color: colors.textSecondary }]}>
              {detailedStats.achievements.datingMomentum}
            </Text>
          </View>
        )}
      </View>
    );
  };

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
          <Pressable 
            style={styles.settingsIcon}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
          <View style={{ width: 24 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  settingsIcon: {
    padding: 4,
  },
  profileHeader: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
    paddingRight: 4,
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
    flexWrap: 'wrap',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 20,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    height: 30,
  },
  compactButtonText: {
    fontSize: 11,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  connectionName: {
    fontSize: 16,
    flex: 1,
  },
  connectionDates: {
    fontSize: 16,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  trendMonth: {
    fontSize: 16,
    fontWeight: '500',
  },
  trendDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendCount: {
    fontSize: 14,
  },
  trendRating: {
    fontSize: 14,
  },
  progressRingContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  trendSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  trendSummaryText: {
    fontSize: 14,
    textAlign: 'center',
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
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  personalityType: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  personalityDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  personalityTraits: {
    flexDirection: 'row',
    gap: 8,
  },
  trait: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  traitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  streakDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  consistencyBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  consistencyProgress: {
    height: '100%',
    borderRadius: 4,
  },
  consistencyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  patternHighlight: {
    fontSize: 16,
    marginBottom: 16,
  },
  timeDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeSlot: {
    alignItems: 'center',
    gap: 4,
  },
  timeSlotLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeSlotValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  locationHighlight: {
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationVisits: {
    fontSize: 14,
  },
  locationDiversity: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  diversityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  diversityScore: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  comparisonStats: {
    gap: 8,
    marginBottom: 16,
  },
  comparisonText: {
    fontSize: 15,
    lineHeight: 22,
  },
  perfectDates: {
    alignItems: 'center',
    marginBottom: 12,
  },
  perfectEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  perfectText: {
    fontSize: 16,
    fontWeight: '600',
  },
  momentumText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});