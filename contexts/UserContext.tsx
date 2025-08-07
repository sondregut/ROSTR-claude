import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserService } from '@/services/supabase/users';
import { useAuth } from '@/contexts/SimpleAuthContext';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  location: string;
  occupation: string;
  age: number;
  imageUri: string;
  instagramUsername?: string;
  stats: {
    totalDates: number;
    activeConnections: number;
    avgRating: number;
    circles: number;
  };
  about: {
    bio: string;
    interests: string[];
  };
  preferences: {
    dating: {
      lookingFor: string;
      ageRange: string;
      education: string;
    };
    dealBreakers: string[];
  };
}

export interface DetailedStats {
  secondDateRate: number;
  datesThisMonth: number;
  datesLastMonth: number;
  avgRatingThisMonth: number;
  firstDateAvgRating: number;
  secondDateAvgRating: number;
  mostUsedTags: Array<{ tag: string; usage_count: number }>;
  longestConnections: Array<{
    person_name: string;
    date_count: number;
    avg_rating: number;
    first_date: string;
    last_date: string;
  }>;
  datingTrends: Array<{
    month_year: string;
    date_count: number;
    avg_rating: number;
  }>;
  // New fun stats
  datingPatterns: {
    mostPopularDay: string;
    mostPopularDayCount: number;
    morningDates: number;
    afternoonDates: number;
    eveningDates: number;
    avgDaysBetweenDates: number;
  };
  streaks: {
    currentStreak: number;
    longestStreak: number;
    totalWeeksDated: number;
    consistencyScore: number;
  };
  locationStats: {
    topLocation: string;
    topLocationCount: number;
    topLocationRating: number;
    uniqueLocations: number;
    mostSuccessfulLocation: string;
    mostSuccessfulRating: number;
    locationDiversityScore: number;
  };
  personality: {
    type: string;
    description: string;
    primaryTrait: string;
    secondaryTrait: string;
    frequencyScore: number;
    varietyScore: number;
    commitmentScore: number;
  };
  achievements: {
    datesRankPercentile: number;
    ratingRankPercentile: number;
    mostDatesInWeek: number;
    perfectDatesCount: number;
    favoriteSeason: string;
    datingMomentum: string;
    uniqueAchievement: string;
  };
}

interface UserContextType {
  id?: string;
  userProfile: UserProfile | null;
  detailedStats: DetailedStats | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
  loadDetailedStats: () => Promise<void>;
  isLoading: boolean;
  isLoadingStats: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform database profile to UserProfile interface
  const transformProfile = (dbProfile: any): UserProfile | null => {
    if (!dbProfile) return null;

    return {
      id: dbProfile.id,
      name: dbProfile.name || '',
      username: dbProfile.username || '',
      bio: dbProfile.bio || '',
      location: dbProfile.location || '',
      occupation: dbProfile.occupation || '',
      age: dbProfile.age || 0,
      imageUri: dbProfile.image_uri || '',
      instagramUsername: dbProfile.instagram_username,
      stats: {
        totalDates: dbProfile.total_dates || 0,
        activeConnections: dbProfile.active_connections || 0,
        avgRating: dbProfile.avg_rating || 0,
        circles: 0, // Will be populated from circles count
      },
      about: {
        bio: dbProfile.bio || '',
        interests: dbProfile.interests || [],
      },
      preferences: {
        dating: {
          lookingFor: dbProfile.dating_preferences?.lookingFor || '',
          ageRange: dbProfile.dating_preferences?.ageRange || '',
          education: dbProfile.dating_preferences?.education || '',
        },
        dealBreakers: dbProfile.deal_breakers || [],
      },
    };
  };

  // Load user profile from Supabase
  const loadProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get profile from database
      const dbProfile = await UserService.getProfile(user.id);
      
      if (dbProfile) {
        // Recalculate stats to ensure they're accurate
        try {
          await UserService.recalculateUserStats(user.id);
          // Reload profile with updated stats
          const updatedProfile = await UserService.getProfile(user.id);
          if (updatedProfile) {
            // Get user stats including circles count
            const stats = await UserService.getUserStats(user.id);
            
            // Transform and set profile
            const transformedProfile = transformProfile(updatedProfile);
            if (transformedProfile && stats) {
              transformedProfile.stats = {
                ...transformedProfile.stats,
                ...stats,
              };
            }
            
            setUserProfile(transformedProfile);
          } else {
            setUserProfile(null);
          }
        } catch (statsError) {
          console.error('Error recalculating stats:', statsError);
          // If stats recalculation fails, still use the original profile
          const transformedProfile = transformProfile(dbProfile);
          setUserProfile(transformedProfile);
        }
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Load detailed statistics
  const loadDetailedStats = async () => {
    if (!user) {
      setDetailedStats(null);
      return;
    }

    try {
      setIsLoadingStats(true);
      
      // Load all detailed stats in parallel
      const [
        secondDateRate,
        activityMetrics,
        ratingBreakdown,
        mostUsedTags,
        longestConnections,
        datingTrends,
        datingPatterns,
        streaks,
        locationStats,
        personality,
        achievements
      ] = await Promise.all([
        UserService.getSecondDateRate(user.id),
        UserService.getActivityMetrics(user.id),
        UserService.getRatingBreakdown(user.id),
        UserService.getMostUsedTags(user.id, 5),
        UserService.getLongestConnections(user.id, 3),
        UserService.getDatingTrends(user.id),
        UserService.getDatingPatterns(user.id),
        UserService.getDatingStreaks(user.id),
        UserService.getLocationStats(user.id),
        UserService.getDatingPersonality(user.id),
        UserService.getDatingAchievements(user.id)
      ]);

      const stats: DetailedStats = {
        secondDateRate,
        datesThisMonth: activityMetrics?.dates_this_month || 0,
        datesLastMonth: activityMetrics?.dates_last_month || 0,
        avgRatingThisMonth: activityMetrics?.avg_rating_this_month || 0,
        firstDateAvgRating: ratingBreakdown?.first_date_avg_rating || 0,
        secondDateAvgRating: ratingBreakdown?.second_date_avg_rating || 0,
        mostUsedTags: mostUsedTags.map(tag => ({
          tag: tag.tag,
          usage_count: Number(tag.usage_count)
        })),
        longestConnections: longestConnections.map(conn => ({
          person_name: conn.person_name,
          date_count: Number(conn.date_count),
          avg_rating: Number(conn.avg_rating),
          first_date: conn.first_date,
          last_date: conn.last_date
        })),
        datingTrends: datingTrends.map(trend => ({
          month_year: trend.month_year,
          date_count: Number(trend.date_count),
          avg_rating: Number(trend.avg_rating)
        })),
        datingPatterns: {
          mostPopularDay: datingPatterns?.most_popular_day || 'N/A',
          mostPopularDayCount: Number(datingPatterns?.most_popular_day_count || 0),
          morningDates: Number(datingPatterns?.morning_dates || 0),
          afternoonDates: Number(datingPatterns?.afternoon_dates || 0),
          eveningDates: Number(datingPatterns?.evening_dates || 0),
          avgDaysBetweenDates: Number(datingPatterns?.avg_days_between_dates || 0)
        },
        streaks: {
          currentStreak: Number(streaks?.current_streak || 0),
          longestStreak: Number(streaks?.longest_streak || 0),
          totalWeeksDated: Number(streaks?.total_weeks_dated || 0),
          consistencyScore: Number(streaks?.consistency_score || 0)
        },
        locationStats: {
          topLocation: locationStats?.top_location || 'N/A',
          topLocationCount: Number(locationStats?.top_location_count || 0),
          topLocationRating: Number(locationStats?.top_location_avg_rating || 0),
          uniqueLocations: Number(locationStats?.unique_locations || 0),
          mostSuccessfulLocation: locationStats?.most_successful_location || 'N/A',
          mostSuccessfulRating: Number(locationStats?.most_successful_rating || 0),
          locationDiversityScore: Number(locationStats?.location_diversity_score || 0)
        },
        personality: {
          type: personality?.personality_type || 'The Explorer',
          description: personality?.description || '',
          primaryTrait: personality?.primary_trait || '',
          secondaryTrait: personality?.secondary_trait || '',
          frequencyScore: Number(personality?.dating_frequency_score || 0),
          varietyScore: Number(personality?.variety_score || 0),
          commitmentScore: Number(personality?.commitment_score || 0)
        },
        achievements: {
          datesRankPercentile: Number(achievements?.total_dates_rank_percentile || 0),
          ratingRankPercentile: Number(achievements?.avg_rating_rank_percentile || 0),
          mostDatesInWeek: Number(achievements?.most_dates_in_week || 0),
          perfectDatesCount: Number(achievements?.perfect_dates_count || 0),
          favoriteSeason: achievements?.favorite_season || 'N/A',
          datingMomentum: achievements?.dating_momentum || 'Getting started',
          uniqueAchievement: achievements?.unique_achievement || 'Rising Star'
        }
      };

      setDetailedStats(stats);
    } catch (err) {
      console.error('Error loading detailed stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // Clear all user data when logged out
      setUserProfile(null);
      setDetailedStats(null);
      setIsLoading(false);
      setIsLoadingStats(false);
      setError(null);
      return;
    }
    
    // Clear previous user's data before loading new user
    setDetailedStats(null);
    loadProfile();
  }, [user?.id]); // Use user.id to detect user changes

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setError(null);
      
      // Transform UserProfile updates to database format
      const dbUpdates: any = {};
      
      // Basic fields
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.imageUri !== undefined) dbUpdates.image_uri = updates.imageUri;
      if (updates.instagramUsername !== undefined) dbUpdates.instagram_username = updates.instagramUsername;
      
      // Complex fields
      if (updates.about?.interests !== undefined) dbUpdates.interests = updates.about.interests;
      if (updates.preferences?.dealBreakers !== undefined) dbUpdates.deal_breakers = updates.preferences.dealBreakers;
      
      // Dating preferences (stored as JSONB)
      if (updates.preferences?.dating) {
        dbUpdates.dating_preferences = {
          ...userProfile?.preferences?.dating,
          ...updates.preferences.dating,
        };
      }
      
      // Optimistically update local state
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }
      
      // Update in database asynchronously
      UserService.updateProfile(user.id, dbUpdates)
        .then(() => {
          // Refresh profile to ensure consistency
          loadProfile();
        })
        .catch((error) => {
          console.error('Failed to update profile in database:', error);
          setError('Failed to update profile');
        });
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      // Revert optimistic update on error
      await loadProfile();
      throw err;
    }
  };

  const value: UserContextType = {
    id: user?.id,
    userProfile,
    detailedStats,
    updateProfile,
    loadDetailedStats,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}