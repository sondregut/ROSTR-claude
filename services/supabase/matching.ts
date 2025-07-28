import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Match = Database['public']['Tables']['matches']['Row'];
type MatchInsert = Database['public']['Tables']['matches']['Insert'];

export interface PotentialMatch {
  user_id: string;
  name: string;
  username: string;
  age: number;
  location: string;
  image_uri: string;
  compatibility_score: number;
  shared_circles: number;
  shared_interests: string[];
}

export interface UserMatch {
  match_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_username: string;
  other_user_image: string;
  match_status: 'pending' | 'matched' | 'rejected';
  matched_at: string | null;
  compatibility_score: number;
}

export interface MatchResult {
  match_id: string;
  is_mutual_match: boolean;
  created_new: boolean;
}

export interface DateRecommendation {
  recommended_user_id: string;
  recommendation_reason: string;
  confidence_score: number;
}

export interface LocationMatch {
  user_id: string;
  name: string;
  username: string;
  location: string;
  distance_km: number;
  compatibility_score: number;
}

export interface TrendingInterest {
  interest: string;
  user_count: number;
  avg_rating: number;
}

export class MatchingService {
  /**
   * Get potential matches for a user
   */
  static async getPotentialMatches(
    userId: string,
    limit: number = 20,
    minScore: number = 0.1
  ): Promise<PotentialMatch[]> {
    try {
      const { data, error } = await supabase.rpc('get_potential_matches', {
        target_user_id: userId,
        limit_count: limit,
        min_score: minScore,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get potential matches error:', error);
      throw error;
    }
  }

  /**
   * Calculate compatibility score between two users
   */
  static async calculateCompatibilityScore(user1Id: string, user2Id: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_compatibility_score', {
        user1_id: user1Id,
        user2_id: user2Id,
      });

      if (error) {
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('Calculate compatibility score error:', error);
      return 0;
    }
  }

  /**
   * Create or update a match (like/reject/super like)
   */
  static async createOrUpdateMatch(
    currentUserId: string,
    targetUserId: string,
    status: 'matched' | 'rejected'
  ): Promise<MatchResult> {
    try {
      const { data, error } = await supabase.rpc('create_or_update_match', {
        user1_id: currentUserId,
        user2_id: targetUserId,
        user1_status: status,
      });

      if (error) {
        throw error;
      }

      return data?.[0] || { match_id: '', is_mutual_match: false, created_new: false };
    } catch (error) {
      console.error('Create or update match error:', error);
      throw error;
    }
  }

  /**
   * Like a user (swipe right)
   */
  static async likeUser(currentUserId: string, targetUserId: string): Promise<MatchResult> {
    return this.createOrUpdateMatch(currentUserId, targetUserId, 'matched');
  }

  /**
   * Reject a user (swipe left)
   */
  static async rejectUser(currentUserId: string, targetUserId: string): Promise<MatchResult> {
    return this.createOrUpdateMatch(currentUserId, targetUserId, 'rejected');
  }

  /**
   * Get user's matches
   */
  static async getUserMatches(
    userId: string,
    statusFilter?: 'pending' | 'matched' | 'rejected'
  ): Promise<UserMatch[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_matches', {
        target_user_id: userId,
        match_status_filter: statusFilter || null,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get user matches error:', error);
      throw error;
    }
  }

  /**
   * Get mutual matches (both users liked each other)
   */
  static async getMutualMatches(userId: string): Promise<UserMatch[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          user_1,
          user_2,
          user_1_status,
          user_2_status,
          matched_at,
          created_at
        `)
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)
        .eq('user_1_status', 'matched')
        .eq('user_2_status', 'matched')
        .not('matched_at', 'is', null);

      if (error) {
        throw error;
      }

      // Get other user details for each match
      const matches = await Promise.all(
        (data || []).map(async (match) => {
          const otherUserId = match.user_1 === userId ? match.user_2 : match.user_1;
          
          const { data: otherUser } = await supabase
            .from('users')
            .select('name, username, image_uri')
            .eq('id', otherUserId)
            .single();

          return {
            match_id: match.id,
            other_user_id: otherUserId,
            other_user_name: otherUser?.name || '',
            other_user_username: otherUser?.username || '',
            other_user_image: otherUser?.image_uri || '',
            match_status: 'matched' as const,
            matched_at: match.matched_at,
            compatibility_score: await this.calculateCompatibilityScore(userId, otherUserId),
          };
        })
      );

      return matches;
    } catch (error) {
      console.error('Get mutual matches error:', error);
      throw error;
    }
  }

  /**
   * Get date-based recommendations
   */
  static async getDateRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<DateRecommendation[]> {
    try {
      const { data, error } = await supabase.rpc('get_date_recommendations', {
        target_user_id: userId,
        limit_count: limit,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get date recommendations error:', error);
      throw error;
    }
  }

  /**
   * Get location-based matches
   */
  static async getLocationMatches(
    userId: string,
    radiusKm: number = 50,
    limit: number = 20
  ): Promise<LocationMatch[]> {
    try {
      const { data, error } = await supabase.rpc('get_location_matches', {
        target_user_id: userId,
        radius_km: radiusKm,
        limit_count: limit,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get location matches error:', error);
      throw error;
    }
  }

  /**
   * Get trending interests
   */
  static async getTrendingInterests(daysBack: number = 30): Promise<TrendingInterest[]> {
    try {
      const { data, error } = await supabase.rpc('get_trending_interests', {
        days_back: daysBack,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get trending interests error:', error);
      throw error;
    }
  }

  /**
   * Refresh user compatibility scores (admin function)
   */
  static async refreshUserCompatibility(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('refresh_user_compatibility');

      if (error) {
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('Refresh user compatibility error:', error);
      throw error;
    }
  }

  /**
   * Get shared interests between current user and target
   */
  static async getSharedInterests(currentUserId: string, targetUserId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_shared_interests', {
        user1_id: currentUserId,
        user2_id: targetUserId,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get shared interests error:', error);
      return [];
    }
  }

  /**
   * Get shared circle count between users
   */
  static async getSharedCircleCount(currentUserId: string, targetUserId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_shared_circle_count', {
        user1_id: currentUserId,
        user2_id: targetUserId,
      });

      if (error) {
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('Get shared circle count error:', error);
      return 0;
    }
  }

  /**
   * Unmatch with a user (remove match)
   */
  static async unmatchUser(currentUserId: string, targetUserId: string): Promise<void> {
    try {
      // Find and delete the match
      const { error } = await supabase
        .from('matches')
        .delete()
        .or(`and(user_1.eq.${currentUserId},user_2.eq.${targetUserId}),and(user_1.eq.${targetUserId},user_2.eq.${currentUserId})`);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Unmatch user error:', error);
      throw error;
    }
  }

  /**
   * Get match statistics for a user
   */
  static async getMatchStatistics(userId: string): Promise<{
    totalLikes: number;
    totalMatches: number;
    totalRejections: number;
    matchRate: number;
    avgCompatibilityScore: number;
  }> {
    try {
      // Get all matches for user
      const { data: matches, error } = await supabase
        .from('matches')
        .select('user_1_status, user_2_status')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`);

      if (error) {
        throw error;
      }

      let totalLikes = 0;
      let totalMatches = 0;
      let totalRejections = 0;

      matches?.forEach((match) => {
        const userStatus = match.user_1 === userId ? match.user_1_status : match.user_2_status;
        
        if (userStatus === 'matched') {
          totalLikes++;
          const otherStatus = match.user_1 === userId ? match.user_2_status : match.user_1_status;
          if (otherStatus === 'matched') {
            totalMatches++;
          }
        } else if (userStatus === 'rejected') {
          totalRejections++;
        }
      });

      const matchRate = totalLikes > 0 ? totalMatches / totalLikes : 0;

      // Calculate average compatibility score with matches
      const matchedUsers = await this.getMutualMatches(userId);
      const avgCompatibilityScore = matchedUsers.length > 0 
        ? matchedUsers.reduce((sum, match) => sum + match.compatibility_score, 0) / matchedUsers.length
        : 0;

      return {
        totalLikes,
        totalMatches,
        totalRejections,
        matchRate,
        avgCompatibilityScore,
      };
    } catch (error) {
      console.error('Get match statistics error:', error);
      return {
        totalLikes: 0,
        totalMatches: 0,
        totalRejections: 0,
        matchRate: 0,
        avgCompatibilityScore: 0,
      };
    }
  }

  /**
   * Get discovery preferences for user
   */
  static async updateDiscoveryPreferences(
    userId: string,
    preferences: {
      minAge?: number;
      maxAge?: number;
      maxDistance?: number;
      interests?: string[];
      location?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          dating_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Update discovery preferences error:', error);
      throw error;
    }
  }

  /**
   * Report a user during matching
   */
  static async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          reason,
          description,
        });

      if (error) {
        throw error;
      }

      // Also create a rejection match to prevent future matches
      await this.rejectUser(reporterId, reportedUserId);
    } catch (error) {
      console.error('Report user error:', error);
      throw error;
    }
  }
}