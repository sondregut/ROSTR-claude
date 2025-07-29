import { supabase } from '@/lib/supabase';
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
  // Get all dates for the feed
  async getDates(userId: string) {
    try {
      // Get user's circles to filter dates
      const { data: userCircles } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId);

      const circleIds = userCircles?.map(c => c.circle_id) || [];

      // Get dates from user's circles or their own dates
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
        .or(`user_id.eq.${userId},shared_circles.ov.{${circleIds.join(',')}}`)
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

      // Group comments by date
      const commentsByDate = comments?.reduce((acc, comment) => {
        if (!acc[comment.date_entry_id]) {
          acc[comment.date_entry_id] = [];
        }
        acc[comment.date_entry_id].push({
          name: comment.user?.name || 'Unknown',
          content: comment.content,
        });
        return acc;
      }, {} as Record<string, Array<{ name: string; content: string }>>) || {};

      // Transform dates with likes and comments
      const transformedDates = dates?.map(date => ({
        ...date,
        isLiked: likedDateIds.has(date.id),
        comments: commentsByDate[date.id] || [],
        authorName: date.user?.name || 'Unknown',
        authorAvatar: date.user?.image_uri,
      })) || [];

      return transformedDates;
    } catch (error) {
      console.error('Error getting dates:', error);
      throw error;
    }
  },

  // Get planned dates
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
            image_uri
          )
        `)
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('date', { ascending: true })
        .limit(20);

      if (error) throw error;

      return plans || [];
    } catch (error) {
      console.error('Error getting plans:', error);
      throw error;
    }
  },

  // Create a new date entry
  async createDate(formData: DateEntryFormData, userId: string) {
    try {
      // Filter out any non-UUID values from circles
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validCircles = (formData.circles || []).filter(circle => uuidRegex.test(circle));
      
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
    try {
      // Check if already liked
      const { data: existing } = await supabase
        .from('date_likes')
        .select('id')
        .eq('date_entry_id', id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Unlike
        await supabase
          .from('date_likes')
          .delete()
          .eq('id', existing.id);

        // Decrement like count
        await supabase.rpc('decrement_date_like_count', { date_id: id });
      } else {
        // Like
        await supabase
          .from('date_likes')
          .insert({
            date_entry_id: id,
            user_id: userId,
          });

        // Increment like count
        await supabase.rpc('increment_date_like_count', { date_id: id });
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
      const { error } = await supabase
        .from('date_comments')
        .insert({
          date_entry_id: id,
          user_id: userId,
          content: comment.content,
        });

      if (error) throw error;

      // Increment comment count
      await supabase.rpc('increment_date_comment_count', { date_id: id });
    } catch (error) {
      console.error('Error adding comment:', error);
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
};