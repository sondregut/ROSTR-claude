import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger';
import type { DateEntryFormData } from '@/components/ui/forms/DateEntryForm';
import type { PlanFormData } from '@/components/ui/modals/AddPlanModal';

export interface DatabaseDateEntry {
  id: string;
  user_id: string;
  person_name: string;
  location: string;
  date: string;
  rating: number;
  notes: string;
  tags: string[];
  shared_circles: string[];
  is_private: boolean;
  image_uri: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  entry_type?: 'date' | 'roster_addition';
  poll_question?: string;
  poll_options?: Array<{
    text: string;
    votes: number;
  }>;
  roster_info?: {
    age?: number;
    occupation?: string;
    how_we_met?: string;
    interests?: string;
    instagram?: string;
    phone?: string;
    photos?: string[];
  };
  user?: {
    id: string;
    name: string;
    username: string;
    image_uri: string;
  };
}

export interface DatabasePlanEntry {
  id: string;
  user_id: string;
  person_name: string;
  date: string;
  time?: string;
  location: string;
  notes?: string;
  tags: string[];
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    image_uri: string;
  };
}

export interface DateLike {
  id: string;
  date_entry_id: string;
  user_id: string;
  created_at: string;
}

export interface DateComment {
  id: string;
  date_entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    name: string;
    username: string;
    image_uri: string;
  };
}

export const DateService = {
  // Helper to get mutual friend IDs (bidirectional friendships)
  async getMutualFriendIds(userId: string): Promise<string[]> {
    try {
      // Get friendships where user is user_id (outgoing)
      const { data: outgoing } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      // Get friendships where user is friend_id (incoming)
      const { data: incoming } = await supabase
        .from('friendships')
        .select('user_id')
        .eq('friend_id', userId)
        .eq('status', 'active');

      // Find intersection (mutual friends - both must have active status)
      const outgoingIds = new Set(outgoing?.map(f => f.friend_id) || []);
      const incomingIds = new Set(incoming?.map(f => f.user_id) || []);
      
      // Return only IDs that appear in both sets (bidirectional friendship)
      const mutualFriends = Array.from(outgoingIds).filter(id => incomingIds.has(id));
      
      logger.debug(`[DateService] Mutual friends for ${userId}: ${mutualFriends.length} found`);
      return mutualFriends;
    } catch (error) {
      console.error('Error getting mutual friends:', error);
      return [];
    }
  },

  // Get all dates for the feed
  async getDates(userId: string) {
    try {
      // Get user's circles to filter dates
      const { data: userCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId);

      const circleIds = userCircles?.map(c => c.circle_id) || [];

      // Get ONLY mutual friends (bidirectional active friendships)
      const friendIds = await this.getMutualFriendIds(userId);

      // Build the OR filter conditions
      let orConditions = [`user_id.eq.${userId}`];
      
      if (circleIds.length > 0) {
        orConditions.push(`shared_circles.ov.{${circleIds.join(',')}}`);
      }
      
      if (friendIds.length > 0) {
        orConditions.push(`user_id.in.(${friendIds.join(',')})`);
      }

      // Get dates from user's own posts, circles, or friends
      const { data: dates, error } = await supabase
        .from('date_entries')
        .select(`
          *,
          user:users (
            id,
            name,
            username,
            instagram_username,
            image_uri
          )
        `)
        .or(orConditions.join(','))
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get likes for these dates
      const dateIds = dates?.map(d => d.id) || [];
      const { data: likes } = await supabase
        .from('date_likes')
        .select('date_entry_id')
        .in('date_entry_id', dateIds)
        .eq('user_id', userId);

      const likedDateIds = new Set(likes?.map(l => l.date_entry_id) || []);

      // Get comments for these dates
      const { data: comments } = await supabase
        .from('date_comments')
        .select(`
          *,
          user:users (
            name,
            username,
            image_uri
          )
        `)
        .in('date_entry_id', dateIds)
        .order('created_at', { ascending: true });

      // Get poll votes for dates with polls
      const datesWithPolls = dates?.filter(d => d.poll_question) || [];
      const pollDateIds = datesWithPolls.map(d => d.id);
      
      const { data: pollVotes } = await supabase
        .from('poll_votes')
        .select('date_entry_id, option_index, user_id')
        .in('date_entry_id', pollDateIds);

      // Get user's own poll votes
      const userPollVotes = pollVotes?.filter(v => v.user_id === userId) || [];
      const userVotesByDate = userPollVotes.reduce((acc, vote) => {
        acc[vote.date_entry_id] = vote.option_index;
        return acc;
      }, {} as Record<string, number>);

      // Count votes for each option
      const votesByDateAndOption = pollVotes?.reduce((acc, vote) => {
        if (!acc[vote.date_entry_id]) {
          acc[vote.date_entry_id] = {};
        }
        if (!acc[vote.date_entry_id][vote.option_index]) {
          acc[vote.date_entry_id][vote.option_index] = 0;
        }
        acc[vote.date_entry_id][vote.option_index]++;
        return acc;
      }, {} as Record<string, Record<number, number>>) || {};

      // Group comments by date
      const commentsByDate = comments?.reduce((acc, comment) => {
        if (!acc[comment.date_entry_id]) {
          acc[comment.date_entry_id] = [];
        }
        acc[comment.date_entry_id].push({
          name: comment.user?.name || 'Unknown',
          content: comment.content,
          imageUri: comment.user?.image_uri || '',
        });
        return acc;
      }, {} as Record<string, Array<{ name: string; content: string; imageUri: string }>>) || {};

      // Get roster photos for each person mentioned in dates
      const personNames = [...new Set(dates?.map(d => d.person_name) || [])];
      const userIds = [...new Set(dates?.map(d => d.user_id) || [])];
      
      let rosterPhotos: Record<string, string | undefined> = {};
      if (personNames.length > 0 && userIds.length > 0) {
        const { data: rosterEntries } = await supabase
          .from('roster_entries')
          .select('user_id, name, photos')
          .in('name', personNames)
          .in('user_id', userIds);
        
        // Create a map of user_id + name -> photo
        rosterPhotos = rosterEntries?.reduce((acc, entry) => {
          const key = `${entry.user_id}_${entry.name}`;
          acc[key] = entry.photos?.[0];
          return acc;
        }, {} as Record<string, string | undefined>) || {};
      }

      // Transform dates with likes, comments, polls, and roster photos
      const transformedDates = dates?.map(date => {
        // Update poll options with actual vote counts
        let poll = undefined;
        if (date.poll_question && date.poll_options) {
          const voteCounts = votesByDateAndOption[date.id] || {};
          poll = {
            question: date.poll_question,
            options: date.poll_options.map((option, index) => ({
              text: option.text,
              votes: voteCounts[index] || 0,
            })),
          };
        }

        // Get roster photo for this person
        const rosterKey = `${date.user_id}_${date.person_name}`;
        const rosterPhoto = rosterPhotos[rosterKey];

        // If this is a roster addition, use the photo from roster_info
        // Otherwise, try to get it from the roster entries
        let personPhoto = date.roster_info?.photos?.[0] || rosterPhoto;

        return {
          ...date,
          isLiked: likedDateIds.has(date.id),
          comments: commentsByDate[date.id] || [],
          authorName: date.user?.name || 'Unknown',
          authorUsername: (() => {
            // Use actual username or instagram_username from database
            // DO NOT generate usernames from names as it causes mismatches
            const username = date.user?.username || date.user?.instagram_username || '';
            
            logger.debug('🔍 DateService: Setting authorUsername for date:', date.id, 
              'user:', date.user?.name, 
              'username:', date.user?.username,
              'instagram:', date.user?.instagram_username,
              'final:', username || 'none');
            
            return username;
          })(),
          authorAvatar: date.user?.image_uri,
          poll,
          userPollVote: userVotesByDate[date.id] ?? null,
          roster_info: {
            ...date.roster_info,
            photos: date.roster_info?.photos || (personPhoto ? [personPhoto] : []),
          },
        };
      }) || [];

      return transformedDates;
    } catch (error) {
      console.error('Error getting dates:', error);
      throw error;
    }
  },

  // Get planned dates
  // Get plans for feed (user's own plans + mutual friends' plans)  
  async getPlansForFeed(userId: string) {
    try {
      // Get user's circles
      const { data: userCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId);

      const circleIds = userCircles?.map(c => c.circle_id) || [];
      
      // Get ONLY mutual friends (bidirectional active friendships)
      const friendIds = await this.getMutualFriendIds(userId);

      // Build filter to include user's own plans and friends' plans
      let userFilter = [userId];
      if (friendIds.length > 0) {
        userFilter = [...userFilter, ...friendIds];
      }

      const { data: plans, error } = await supabase
        .from('date_plans')
        .select(`
          *,
          user:users (
            id,
            name,
            username,
            instagram_username,
            image_uri
          )
        `)
        .in('user_id', userFilter)
        .eq('is_completed', false)
        .order('date', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Get likes for these plans
      const planIds = plans?.map(p => p.id) || [];
      const { data: likes } = await supabase
        .from('plan_likes')
        .select('date_plan_id')
        .in('date_plan_id', planIds)
        .eq('user_id', userId);

      // Get all likes for these plans to calculate counts
      const { data: allLikes } = await supabase
        .from('plan_likes')
        .select('date_plan_id')
        .in('date_plan_id', planIds);

      const likedPlanIds = new Set(likes?.map(l => l.date_plan_id) || []);
      
      // Calculate like counts for each plan
      const likeCountsByPlan = allLikes?.reduce((acc, like) => {
        acc[like.date_plan_id] = (acc[like.date_plan_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get comments for these plans
      const { data: comments } = await supabase
        .from('plan_comments')
        .select(`
          *,
          user:users (
            name,
            username,
            image_uri
          )
        `)
        .in('date_plan_id', planIds)
        .order('created_at', { ascending: true });

      // Group comments by plan
      const commentsByPlan = comments?.reduce((acc, comment) => {
        if (!acc[comment.date_plan_id]) {
          acc[comment.date_plan_id] = [];
        }
        acc[comment.date_plan_id].push({
          name: comment.user?.name || 'Unknown',
          content: comment.content,
          imageUri: comment.user?.image_uri || '',
        });
        return acc;
      }, {} as Record<string, Array<{ name: string; content: string; imageUri: string }>>) || {};

      return plans?.map(plan => ({
        ...plan,
        isLiked: likedPlanIds.has(plan.id),
        comments: commentsByPlan[plan.id] || [],
        likeCount: likeCountsByPlan[plan.id] || 0,
        commentCount: commentsByPlan[plan.id]?.length || 0,
      })) || [];

    } catch (error) {
      console.error('Get plans for feed error:', error);
      throw error;
    }
  },

  async getFriendDatesForPerson(friendUserId: string, personName: string) {
    try {
      const { data: dates, error } = await supabase
        .from('date_entries')
        .select(`
          *,
          user:users (
            id,
            name,
            username,
            image_uri
          )
        `)
        .eq('user_id', friendUserId)
        .eq('person_name', personName)
        .order('date', { ascending: false });

      if (error) throw error;

      if (!dates || dates.length === 0) {
        return [];
      }

      // Get current user for likes check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const dateIds = dates.map(d => d.id);

      // Get likes for these dates
      const { data: likes } = await supabase
        .from('date_likes')
        .select('date_entry_id')
        .in('date_entry_id', dateIds)
        .eq('user_id', user.id);

      const likedDateIds = new Set(likes?.map(l => l.date_entry_id) || []);

      // Get comments for these dates
      const { data: comments } = await supabase
        .from('date_comments')
        .select(`
          *,
          user:users (
            name,
            username,
            image_uri
          )
        `)
        .in('date_entry_id', dateIds)
        .order('created_at', { ascending: true });

      // Group comments by date
      const commentsByDate = comments?.reduce((acc, comment) => {
        if (!acc[comment.date_entry_id]) {
          acc[comment.date_entry_id] = [];
        }
        acc[comment.date_entry_id].push({
          name: comment.user?.name || 'Unknown',
          content: comment.content,
          imageUri: comment.user?.image_uri || '',
        });
        return acc;
      }, {} as Record<string, Array<{ name: string; content: string; imageUri: string }>>) || {};

      // Get like counts
      const { data: likeCounts } = await supabase
        .from('date_likes')
        .select('date_entry_id')
        .in('date_entry_id', dateIds);

      const likeCountsByDate = likeCounts?.reduce((acc, like) => {
        acc[like.date_entry_id] = (acc[like.date_entry_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Transform dates with engagement data
      return dates.map(date => ({
        id: date.id,
        personName: date.person_name,
        date: date.date,
        location: date.location,
        rating: date.rating,
        notes: date.notes,
        tags: date.tags || [],
        imageUri: date.image_uri,
        instagramUsername: date.roster_info?.instagram || '',
        authorName: date.user?.name || '',
        authorAvatar: date.user?.image_uri || '',
        likeCount: likeCountsByDate[date.id] || 0,
        commentCount: commentsByDate[date.id]?.length || 0,
        isLiked: likedDateIds.has(date.id),
        comments: commentsByDate[date.id] || [],
        poll: date.poll_question ? {
          question: date.poll_question,
          options: date.poll_options || []
        } : undefined,
      }));

    } catch (error) {
      console.error('Get friend dates for person error:', error);
      return [];
    }
  },

  async getPlans(userId: string) {
    try {
      const { data: plans, error } = await supabase
        .from('date_plans')
        .select(`
          *,
          user:users (
            id,
            name,
            username,
            instagram_username,
            image_uri
          )
        `)
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('date', { ascending: true })
        .limit(20);

      if (error) throw error;

      // Get likes for these plans
      const planIds = plans?.map(p => p.id) || [];
      const { data: likes } = await supabase
        .from('plan_likes')
        .select('date_plan_id')
        .in('date_plan_id', planIds)
        .eq('user_id', userId);

      const likedPlanIds = new Set(likes?.map(l => l.date_plan_id) || []);

      // Get comments for these plans
      const { data: comments } = await supabase
        .from('plan_comments')
        .select(`
          *,
          user:users (
            name,
            username,
            image_uri
          )
        `)
        .in('date_plan_id', planIds)
        .order('created_at', { ascending: true });

      // Group comments by plan
      const commentsByPlan = comments?.reduce((acc, comment) => {
        if (!acc[comment.date_plan_id]) {
          acc[comment.date_plan_id] = [];
        }
        acc[comment.date_plan_id].push({
          name: comment.user?.name || 'Unknown',
          content: comment.content,
          imageUri: comment.user?.image_uri || '',
        });
        return acc;
      }, {} as Record<string, Array<{ name: string; content: string; imageUri: string }>>) || {};

      // Get like counts for plans
      const { data: likeCounts } = await supabase
        .from('plan_likes')
        .select('date_plan_id')
        .in('date_plan_id', planIds);

      const likeCountsByPlan = likeCounts?.reduce((acc, like) => {
        acc[like.date_plan_id] = (acc[like.date_plan_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get roster photos for people in plans
      const planPersonNames = [...new Set(plans?.map(p => p.person_name) || [])];
      const planUserIds = [...new Set(plans?.map(p => p.user_id) || [])];
      
      let planRosterPhotos: Record<string, string | undefined> = {};
      if (planPersonNames.length > 0 && planUserIds.length > 0) {
        const { data: rosterEntries } = await supabase
          .from('roster_entries')
          .select('user_id, name, photos')
          .in('name', planPersonNames)
          .in('user_id', planUserIds);
        
        // Create a map of user_id + name -> photo
        planRosterPhotos = rosterEntries?.reduce((acc, entry) => {
          const key = `${entry.user_id}_${entry.name}`;
          acc[key] = entry.photos?.[0];
          return acc;
        }, {} as Record<string, string | undefined>) || {};
      }

      // Transform plans with likes, comments, and roster photos
      const transformedPlans = plans?.map(plan => {
        const rosterKey = `${plan.user_id}_${plan.person_name}`;
        const rosterPhoto = planRosterPhotos[rosterKey];
        
        return {
          ...plan,
          isLiked: likedPlanIds.has(plan.id),
          likeCount: likeCountsByPlan[plan.id] || 0,
          commentCount: commentsByPlan[plan.id]?.length || 0,
          comments: commentsByPlan[plan.id] || [],
          roster_info: {
            photos: rosterPhoto ? [rosterPhoto] : [],
          },
        };
      }) || [];

      return transformedPlans;
    } catch (error) {
      console.error('Error getting plans:', error);
      throw error;
    }
  },

  // Create a new date entry
  async createDate(formData: DateEntryFormData, userId: string) {
    try {
      let validCircles: string[] = [];
      
      if (formData.circles?.includes('ALL_FRIENDS')) {
        // If "All Friends" is selected, get all user's circles
        const { data: userCircles } = await supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', userId);
        
        validCircles = userCircles?.map(c => c.circle_id) || [];
      } else {
        // Filter out any non-UUID values from circles
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        validCircles = (formData.circles || []).filter(circle => uuidRegex.test(circle));
      }
      
      const { data, error } = await supabase
        .from('date_entries')
        .insert({
          user_id: userId,
          person_name: formData.personName,
          location: formData.location,
          date: formData.date,
          rating: formData.rating,
          notes: formData.notes || '',
          tags: formData.tags || [],
          shared_circles: validCircles,
          is_private: formData.isPrivate || false,
          image_uri: formData.imageUri || '',
          poll_question: formData.poll?.question || null,
          poll_options: formData.poll?.options 
            ? formData.poll.options.map(text => ({ text, votes: 0 }))
            : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating date:', error);
      throw error;
    }
  },

  // Create a roster addition entry for the feed
  async createRosterAddition(personName: string, rosterInfo: any, userId: string, circles: string[] = [], isPrivate: boolean = false) {
    try {
      console.log('[DateService] Creating roster addition with:', {
        personName,
        photos: rosterInfo.photos,
        firstPhoto: rosterInfo.photos?.[0],
      });
      
      // Handle "ALL_FRIENDS" special case - convert to actual circle UUIDs or filter out
      let validCircles: string[] = [];
      
      if (circles.includes('ALL_FRIENDS')) {
        // If "All Friends" is selected, get all user's circles
        const { data: userCircles } = await supabase
          .from('circle_members')
          .select('circle_id')
          .eq('user_id', userId);
        
        validCircles = userCircles?.map(uc => uc.circle_id) || [];
      } else {
        // Filter out any non-UUID values and keep only valid circle IDs
        validCircles = circles.filter(circleId => 
          circleId !== 'ALL_FRIENDS' && 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(circleId)
        );
      }

      const { data, error } = await supabase
        .from('date_entries')
        .insert({
          user_id: userId,
          person_name: personName,
          location: '', // Not applicable for roster additions
          date: new Date().toISOString(), // Current timestamp
          rating: null, // No rating for roster additions
          notes: `Added ${personName} to roster`,
          tags: [],
          shared_circles: validCircles,
          is_private: isPrivate,
          image_uri: rosterInfo.photos?.[0] || '',
          entry_type: 'roster_addition',
          roster_info: {
            age: rosterInfo.age,
            occupation: rosterInfo.occupation,
            how_we_met: rosterInfo.how_we_met,
            interests: rosterInfo.interests,
            instagram: rosterInfo.instagram,
            phone: rosterInfo.phone,
            photos: rosterInfo.photos || [],
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating roster addition:', error);
      throw error;
    }
  },

  // Create a planned date
  async createPlan(formData: PlanFormData, personName: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('date_plans')
        .insert({
          user_id: userId,
          person_name: personName,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          notes: formData.content,
          tags: formData.tags || [],
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  },

  // Complete a planned date by converting it to a date entry
  async completePlan(planId: string, dateData: DateEntryFormData, userId: string) {
    try {
      // Create the date entry
      const dateEntry = await this.createDate(dateData, userId);

      // Mark plan as completed
      const { error } = await supabase
        .from('date_plans')
        .update({ is_completed: true })
        .eq('id', planId);

      if (error) throw error;
      return dateEntry;
    } catch (error) {
      console.error('Error completing plan:', error);
      throw error;
    }
  },

  // Update a planned date
  async updatePlan(id: string, updates: Partial<DatabasePlanEntry>) {
    try {
      const { data, error } = await supabase
        .from('date_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  // Update a date entry
  async updateDate(id: string, updates: Partial<DatabaseDateEntry>) {
    try {
      const { data, error } = await supabase
        .from('date_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating date:', error);
      throw error;
    }
  },

  // Delete a date entry
  async deleteDate(id: string) {
    try {
      const { error } = await supabase
        .from('date_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting date:', error);
      throw error;
    }
  },

  // Delete a planned date
  async deletePlan(id: string) {
    try {
      const { error } = await supabase
        .from('date_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  },

  // Like a date entry
  async likeDate(id: string, userId: string) {
    console.log('🔍 DateService.likeDate called with:', { id, userId });
    
    try {
      // Check if already liked
      const { data: existing, error: checkError } = await supabase
        .from('date_likes')
        .select('id')
        .eq('date_entry_id', id)
        .eq('user_id', userId)
        .single();
      
      console.log('🔍 DateService: Existing like check:', { existing, checkError });

      if (existing) {
        console.log('🔍 DateService: Unliking date...');
        // Unlike
        const { error: deleteError } = await supabase
          .from('date_likes')
          .delete()
          .eq('id', existing.id);
        
        if (deleteError) {
          console.error('❌ DateService: Error deleting like:', deleteError);
          throw deleteError;
        }

        // Decrement like count
        const { error: decrementError } = await supabase.rpc('decrement_date_like_count', { date_id: id });
        if (decrementError) {
          console.error('❌ DateService: Error decrementing like count:', decrementError);
          throw decrementError;
        }
        
        console.log('✅ DateService: Successfully unliked');
      } else {
        console.log('🔍 DateService: Liking date...');
        // Like
        const { error: insertError } = await supabase
          .from('date_likes')
          .insert({
            date_entry_id: id,
            user_id: userId,
          });
        
        if (insertError) {
          console.error('❌ DateService: Error inserting like:', insertError);
          throw insertError;
        }

        // Increment like count
        const { error: incrementError } = await supabase.rpc('increment_date_like_count', { date_id: id });
        if (incrementError) {
          console.error('❌ DateService: Error incrementing like count:', incrementError);
          throw incrementError;
        }
        
        console.log('✅ DateService: Successfully liked');
        // Note: Notification is handled by database trigger automatically
      }
    } catch (error) {
      console.error('Error liking date:', error);
      throw error;
    }
  },

  // Like a planned date
  async likePlan(id: string, userId: string) {
    try {
      // Check if already liked
      const { data: existing } = await supabase
        .from('plan_likes')
        .select('id')
        .eq('date_plan_id', id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Unlike
        await supabase
          .from('plan_likes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Like
        await supabase
          .from('plan_likes')
          .insert({
            date_plan_id: id,
            user_id: userId,
          });
      }
    } catch (error) {
      console.error('Error liking plan:', error);
      throw error;
    }
  },

  // Add a comment to a date entry
  async addComment(id: string, comment: { name: string; content: string }, userId: string) {
    try {
      console.log('🔍 Adding comment:', { id, comment, userId });
      
      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ User not authenticated:', authError);
        throw new Error('User not authenticated');
      }
      
      if (user.id !== userId) {
        console.error('❌ User ID mismatch:', { authUserId: user.id, providedUserId: userId });
        throw new Error('User ID mismatch');
      }

      // Verify the date entry exists
      const { data: dateEntry, error: dateError } = await supabase
        .from('date_entries')
        .select('id, user_id, person_name')
        .eq('id', id)
        .single();

      if (dateError || !dateEntry) {
        console.error('❌ Date entry not found:', dateError);
        throw new Error('Date entry not found');
      }

      console.log('✅ Date entry found:', dateEntry);

      const { data: insertedComment, error: insertError } = await supabase
        .from('date_comments')
        .insert({
          date_entry_id: id,
          user_id: userId,
          content: comment.content,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to insert comment:', insertError);
        throw insertError;
      }

      console.log('✅ Comment inserted successfully:', insertedComment);
      // Note: Notification is handled by database trigger automatically

      // Try to increment comment count
      try {
        const { error: countError } = await supabase.rpc('increment_date_comment_count', {
          date_id: id
        });
        
        if (countError) {
          console.warn('⚠️ Failed to increment comment count:', countError);
          // Don't throw here, comment was still added successfully
        } else {
          console.log('✅ Comment count incremented');
        }
      } catch (countErr) {
        console.warn('⚠️ Comment count increment failed:', countErr);
        // Don't throw here, comment was still added successfully
      }

      return insertedComment;
      
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  },

  // Add a comment to a planned date
  async addPlanComment(id: string, comment: { name: string; content: string }, userId: string) {
    try {
      const { error } = await supabase
        .from('plan_comments')
        .insert({
          date_plan_id: id,
          user_id: userId,
          content: comment.content,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding plan comment:', error);
      throw error;
    }
  },

  // Update a roster addition entry
  async updateRosterAddition(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('date_entries')
        .update({
          person_name: updates.personName,
          notes: updates.notes || '',
          image_uri: updates.photos?.[0] || '',
          roster_info: {
            age: updates.age,
            occupation: updates.occupation,
            how_we_met: updates.howWeMet,
            interests: updates.interests,
            instagram: updates.instagram,
            phone: updates.phone,
            photos: updates.photos,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('entry_type', 'roster_addition')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating roster addition:', error);
      throw error;
    }
  },

  // Delete a roster addition entry
  async deleteRosterAddition(id: string) {
    try {
      const { error } = await supabase
        .from('date_entries')
        .delete()
        .eq('id', id)
        .eq('entry_type', 'roster_addition');

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting roster addition:', error);
      throw error;
    }
  },

  // Sync roster changes to all corresponding feed entries
  async syncRosterToFeedEntries(userId: string, originalPersonName: string, rosterData: any) {
    try {
      console.log('[DateService] Syncing roster to feed entries:', {
        originalPersonName,
        photos: rosterData.photos,
        firstPhoto: rosterData.photos?.[0],
      });
      
      // Build the update object, only including fields that have values
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only update person_name if it's actually changing
      if (rosterData.name && rosterData.name !== originalPersonName) {
        updateData.person_name = rosterData.name;
      }

      // Update image if photos exist
      if (rosterData.photos && rosterData.photos.length > 0) {
        updateData.image_uri = rosterData.photos[0];
      }

      // Update roster_info with only the provided fields
      const rosterInfo: any = {};
      if (rosterData.age !== undefined) rosterInfo.age = rosterData.age;
      if (rosterData.occupation !== undefined) rosterInfo.occupation = rosterData.occupation;
      if (rosterData.how_we_met !== undefined) rosterInfo.how_we_met = rosterData.how_we_met;
      if (rosterData.interests !== undefined) rosterInfo.interests = rosterData.interests;
      if (rosterData.instagram !== undefined) rosterInfo.instagram = rosterData.instagram;
      if (rosterData.phone !== undefined) rosterInfo.phone = rosterData.phone;
      if (rosterData.photos !== undefined) rosterInfo.photos = rosterData.photos;

      // Only update roster_info if we have fields to update
      if (Object.keys(rosterInfo).length > 0) {
        updateData.roster_info = rosterInfo;
      }

      const { data, error } = await supabase
        .from('date_entries')
        .update(updateData)
        .eq('user_id', userId)
        .eq('person_name', originalPersonName)
        .eq('entry_type', 'roster_addition')
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error syncing roster to feed entries:', error);
      throw error;
    }
  },

  // Vote on a poll
  async voteOnPoll(id: string, optionIndex: number, userId: string) {
    try {
      // Check if already voted
      const { data: existing } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('date_entry_id', id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update vote
        await supabase
          .from('poll_votes')
          .update({
            option_index: optionIndex,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Create new vote
        await supabase
          .from('poll_votes')
          .insert({
            date_entry_id: id,
            user_id: userId,
            option_index: optionIndex,
          });
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      throw error;
    }
  },

  // React to a date entry
  async reactToDate(id: string, reaction: string | null, userId: string) {
    console.log('🔍 DateService.reactToDate called with:', { id, reaction, userId });
    
    try {
      // Check if user has existing reaction
      const { data: existing, error: checkError } = await supabase
        .from('date_reactions')
        .select('id, reaction_type')
        .eq('date_entry_id', id)
        .eq('user_id', userId)
        .single();
      
      console.log('🔍 DateService: Existing reaction check:', { existing, checkError });

      if (existing) {
        if (reaction === null) {
          console.log('🔍 DateService: Removing reaction...');
          // Remove reaction
          const { error: deleteError } = await supabase
            .from('date_reactions')
            .delete()
            .eq('id', existing.id);
          
          if (deleteError) {
            console.error('❌ DateService: Error deleting reaction:', deleteError);
            throw deleteError;
          }
          
          console.log('✅ DateService: Successfully removed reaction');
        } else if (existing.reaction_type !== reaction) {
          console.log('🔍 DateService: Updating reaction...');
          // Update reaction
          const { error: updateError } = await supabase
            .from('date_reactions')
            .update({
              reaction_type: reaction,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          
          if (updateError) {
            console.error('❌ DateService: Error updating reaction:', updateError);
            throw updateError;
          }
          
          console.log('✅ DateService: Successfully updated reaction');
        }
      } else if (reaction !== null) {
        console.log('🔍 DateService: Adding new reaction...');
        // Add new reaction
        const { error: insertError } = await supabase
          .from('date_reactions')
          .insert({
            date_entry_id: id,
            user_id: userId,
            reaction_type: reaction,
          });
        
        if (insertError) {
          console.error('❌ DateService: Error inserting reaction:', insertError);
          throw insertError;
        }
        
        console.log('✅ DateService: Successfully added reaction');
      }
    } catch (error) {
      console.error('Error reacting to date:', error);
      throw error;
    }
  },

  // React to a planned date
  async reactToPlan(id: string, reaction: string | null, userId: string) {
    console.log('🔍 DateService.reactToPlan called with:', { id, reaction, userId });
    
    try {
      // Check if user has existing reaction
      const { data: existing, error: checkError } = await supabase
        .from('plan_reactions')
        .select('id, reaction_type')
        .eq('plan_id', id)
        .eq('user_id', userId)
        .single();
      
      console.log('🔍 DateService: Existing plan reaction check:', { existing, checkError });

      if (existing) {
        if (reaction === null) {
          console.log('🔍 DateService: Removing plan reaction...');
          // Remove reaction
          const { error: deleteError } = await supabase
            .from('plan_reactions')
            .delete()
            .eq('id', existing.id);
          
          if (deleteError) {
            console.error('❌ DateService: Error deleting plan reaction:', deleteError);
            throw deleteError;
          }
          
          console.log('✅ DateService: Successfully removed plan reaction');
        } else if (existing.reaction_type !== reaction) {
          console.log('🔍 DateService: Updating plan reaction...');
          // Update reaction
          const { error: updateError } = await supabase
            .from('plan_reactions')
            .update({
              reaction_type: reaction,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          
          if (updateError) {
            console.error('❌ DateService: Error updating plan reaction:', updateError);
            throw updateError;
          }
          
          console.log('✅ DateService: Successfully updated plan reaction');
        }
      } else if (reaction !== null) {
        console.log('🔍 DateService: Adding new plan reaction...');
        // Add new reaction
        const { error: insertError } = await supabase
          .from('plan_reactions')
          .insert({
            plan_id: id,
            user_id: userId,
            reaction_type: reaction,
          });
        
        if (insertError) {
          console.error('❌ DateService: Error inserting plan reaction:', insertError);
          throw insertError;
        }
        
        console.log('✅ DateService: Successfully added plan reaction');
      }
    } catch (error) {
      console.error('Error reacting to plan:', error);
      throw error;
    }
  },

  // Delete all date entries for a specific person
  async deleteDateEntriesForPerson(userId: string, personName: string) {
    try {
      console.log('[DateService] Deleting all date entries for person:', { userId, personName });
      
      const { error } = await supabase
        .from('date_entries')
        .delete()
        .eq('user_id', userId)
        .eq('person_name', personName);

      if (error) throw error;
      
      console.log('[DateService] Successfully deleted date entries for:', personName);
    } catch (error) {
      console.error('Error deleting date entries for person:', error);
      throw error;
    }
  },
};