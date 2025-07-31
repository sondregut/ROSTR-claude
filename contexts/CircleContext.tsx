import React, { createContext, useContext, useState, useEffect } from 'react';
import { CircleService, Circle, CircleMember } from '@/services/supabase/circles';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { supabase } from '@/lib/supabase';

interface CircleWithDetails extends Circle {
  members: CircleMember[];
  recentUpdates: any[];
}

interface CircleContextType {
  circles: Circle[];
  currentCircle: CircleWithDetails | null;
  isLoading: boolean;
  error: string | null;
  loadCircle: (circleId: string) => Promise<void>;
  refreshCircles: () => Promise<void>;
  createCircle: (data: { name: string; description: string; isPrivate: boolean; groupPhotoUrl?: string }) => Promise<Circle>;
  updateCircle: (circleId: string, updates: Partial<Circle>) => Promise<void>;
  deleteCircle: (circleId: string) => Promise<void>;
  addMember: (circleId: string, email: string) => Promise<void>;
  removeMember: (circleId: string, userId: string) => Promise<void>;
  updateMemberRole: (circleId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
}

const CircleContext = createContext<CircleContextType | undefined>(undefined);

export function CircleProvider({ children }: { children: React.ReactNode }) {
  const auth = useSafeAuth();
  const user = auth?.user;
  const [circles, setCircles] = useState<Circle[]>([]);
  const [currentCircle, setCurrentCircle] = useState<CircleWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's circles
  const loadCircles = async (isRefresh = false) => {
    if (!user) {
      setCircles([]);
      setIsLoading(false);
      return;
    }

    try {
      // Only show loading state if not refreshing or if there's no existing data
      if (!isRefresh || circles.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      
      const userCircles = await CircleService.getUserCircles(user.id);
      setCircles(userCircles);
    } catch (err) {
      console.error('Error loading circles:', err);
      setError('Failed to load circles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCircles();
  }, [user]);

  const loadCircle = async (circleId: string) => {
    try {
      setError(null);
      
      const { circle, members } = await CircleService.getCircleWithMembers(circleId);
      
      // Get member user IDs (excluding the current user)
      const memberUserIds = members
        .filter(m => m.user_id !== user?.id)
        .map(m => m.user_id);

      // Fetch recent dates from circle members
      let recentUpdates = [];
      
      if (memberUserIds.length > 0) {
        // Get dates that are either shared with this circle or from circle members
        const { data: dates, error: datesError } = await supabase
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
          .or(`shared_circles.cs.{${circleId}},user_id.in.(${memberUserIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!datesError && dates) {
          // Get likes for these dates
          const dateIds = dates.map(d => d.id);
          const { data: likes } = await supabase
            .from('date_likes')
            .select('date_entry_id')
            .in('date_entry_id', dateIds)
            .eq('user_id', user?.id || '');

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

          // Transform dates into the format expected by DateCard
          recentUpdates = dates.map(date => ({
            id: date.id,
            personName: date.person_name,
            date: new Date(date.created_at).toLocaleDateString(),
            location: date.location,
            rating: date.rating,
            notes: date.notes,
            tags: date.tags,
            imageUri: date.image_uri,
            author: date.user?.name || 'Unknown',
            authorAvatar: date.user?.image_uri,
            likeCount: date.like_count || 0,
            commentCount: date.comment_count || 0,
            isLiked: likedDateIds.has(date.id),
            comments: commentsByDate[date.id] || [],
            entryType: date.entry_type,
            rosterInfo: date.roster_info,
            poll: date.poll_question ? {
              question: date.poll_question,
              options: date.poll_options || []
            } : undefined,
            createdAt: date.created_at,
          }));
        }

        // Also fetch plans from circle members
        const { data: plans, error: plansError } = await supabase
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
          .in('user_id', memberUserIds)
          .eq('is_completed', false)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!plansError && plans) {
          // Get likes for these plans
          const planIds = plans.map(p => p.id);
          const { data: planLikes } = await supabase
            .from('plan_likes')
            .select('date_plan_id')
            .in('date_plan_id', planIds)
            .eq('user_id', user?.id || '');

          const likedPlanIds = new Set(planLikes?.map(l => l.date_plan_id) || []);

          // Get comments for these plans
          const { data: planComments } = await supabase
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
          const commentsByPlan = planComments?.reduce((acc, comment) => {
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

          // Transform plans and add to updates
          const planUpdates = plans.map(plan => ({
            id: plan.id,
            personName: plan.person_name,
            date: plan.date,
            rawDate: plan.date,
            time: plan.time,
            location: plan.location,
            content: plan.notes,
            tags: plan.tags || [],
            authorName: plan.user?.name || 'Unknown',
            authorAvatar: plan.user?.image_uri,
            createdAt: plan.created_at,
            isCompleted: plan.is_completed,
            likeCount: 0, // TODO: Add like count to plans table
            commentCount: commentsByPlan[plan.id]?.length || 0,
            isLiked: likedPlanIds.has(plan.id),
            comments: commentsByPlan[plan.id] || [],
            entryType: 'plan',
          }));

          // Combine dates and plans, sorted by creation time
          recentUpdates = [...recentUpdates, ...planUpdates].sort((a, b) => 
            new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
          ).slice(0, 20);
        }
      }
      
      const circleWithDetails: CircleWithDetails = {
        ...circle,
        members,
        recentUpdates,
      };
      
      setCurrentCircle(circleWithDetails);
    } catch (err) {
      console.error('Error loading circle:', err);
      setError('Failed to load circle details');
      throw err;
    }
  };

  const createCircle = async (data: { name: string; description: string; isPrivate: boolean; groupPhotoUrl?: string }) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const newCircle = await CircleService.createCircle(
        data.name,
        data.description,
        user.id,
        data.groupPhotoUrl
      );
      
      // Refresh circles list
      await loadCircles();
      
      return newCircle;
    } catch (err) {
      console.error('Error creating circle:', err);
      setError('Failed to create circle');
      throw err;
    }
  };

  const updateCircle = async (circleId: string, updates: Partial<Circle>) => {
    try {
      await CircleService.updateCircle(circleId, updates);
      
      // Refresh circles and current circle if needed
      await loadCircles();
      if (currentCircle?.id === circleId) {
        await loadCircle(circleId);
      }
    } catch (err) {
      console.error('Error updating circle:', err);
      setError('Failed to update circle');
      throw err;
    }
  };

  const deleteCircle = async (circleId: string) => {
    try {
      await CircleService.deleteCircle(circleId);
      
      // Clear current circle if it was deleted
      if (currentCircle?.id === circleId) {
        setCurrentCircle(null);
      }
      
      // Refresh circles list
      await loadCircles();
    } catch (err) {
      console.error('Error deleting circle:', err);
      setError('Failed to delete circle');
      throw err;
    }
  };

  const addMember = async (circleId: string, email: string) => {
    try {
      await CircleService.addMemberByEmail(circleId, email);
      
      // Refresh current circle
      if (currentCircle?.id === circleId) {
        await loadCircle(circleId);
      }
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member');
      throw err;
    }
  };

  const removeMember = async (circleId: string, userId: string) => {
    try {
      await CircleService.removeMember(circleId, userId);
      
      // Refresh current circle
      if (currentCircle?.id === circleId) {
        await loadCircle(circleId);
      }
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
      throw err;
    }
  };

  const updateMemberRole = async (circleId: string, userId: string, role: 'admin' | 'member') => {
    try {
      await CircleService.updateMemberRole(circleId, userId, role);
      
      // Refresh current circle
      if (currentCircle?.id === circleId) {
        await loadCircle(circleId);
      }
    } catch (err) {
      console.error('Error updating member role:', err);
      setError('Failed to update member role');
      throw err;
    }
  };

  const refreshCircles = async () => {
    await loadCircles(true);
  };

  const value = {
    circles,
    currentCircle,
    isLoading,
    error,
    loadCircle,
    refreshCircles,
    createCircle,
    updateCircle,
    deleteCircle,
    addMember,
    removeMember,
    updateMemberRole,
  };

  return <CircleContext.Provider value={value}>{children}</CircleContext.Provider>;
}

export function useCircles() {
  const context = useContext(CircleContext);
  if (context === undefined) {
    throw new Error('useCircles must be used within a CircleProvider');
  }
  return context;
}