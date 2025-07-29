import React, { createContext, useContext, useState, useEffect } from 'react';
import { DateService } from '@/services/supabase/dates';
import { StorageService } from '@/services/supabase/storage';
import { DateEntryFormData } from '@/components/ui/forms/DateEntryForm';
import { PlanFormData } from '@/components/ui/modals/AddPlanModal';
import { useAuth } from '@/contexts/SimpleAuthContext';

// Extended interface for date entries in the feed
export interface DateEntry {
  id: string;
  personName: string;
  date: string; // ISO string or relative time like "2h ago"
  location: string;
  rating: number;
  notes: string;
  tags: string[];
  circles: string[];
  isPrivate: boolean;
  imageUri?: string;
  poll?: {
    question: string;
    options: Array<{
      text: string;
      votes: number;
    }>;
  };
  userPollVote?: number | null;
  comments: Array<{
    name: string;
    content: string;
  }>;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  authorName: string; // The user who created this entry
  authorAvatar?: string;
  createdAt: string; // ISO timestamp for sorting
  updatedAt: string;
  isOwnPost?: boolean; // Whether this post belongs to the current user
}

// Interface for planned dates
export interface PlanEntry {
  id: string;
  personName: string;
  date: string; // formatted display date (e.g., "Tomorrow", "Friday", "Jan 15")
  rawDate: string; // original YYYY-MM-DD format
  time?: string;
  location: string;
  content?: string;
  tags: string[];
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  isCompleted: boolean;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  comments: Array<{
    name: string;
    content: string;
  }>;
}

interface DateContextType {
  dates: DateEntry[];
  plans: PlanEntry[];
  addDate: (formData: DateEntryFormData) => Promise<void>;
  addPlan: (formData: PlanFormData, personName: string) => Promise<void>;
  completePlan: (planId: string, dateData: DateEntryFormData) => Promise<void>;
  updateDate: (id: string, updates: Partial<DateEntry>) => Promise<void>;
  deleteDate: (id: string) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  likeDate: (id: string) => Promise<void>;
  likePlan: (id: string) => Promise<void>;
  addComment: (id: string, comment: { name: string; content: string }) => Promise<void>;
  addPlanComment: (id: string, comment: { name: string; content: string }) => Promise<void>;
  voteOnPoll: (id: string, optionIndex: number) => Promise<void>;
  refreshDates: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

// Smart date formatting function
const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7 && diffDays > 1) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Convert relative time strings to actual timestamps
const getActualTimestamp = (relativeTime: string): string => {
  const now = new Date();
  
  if (relativeTime.includes('ago')) {
    const match = relativeTime.match(/(\d+)([hmd])/);
    if (match) {
      const [_, value, unit] = match;
      const num = parseInt(value);
      
      switch(unit) {
        case 'h':
          now.setHours(now.getHours() - num);
          break;
        case 'd':
          now.setDate(now.getDate() - num);
          break;
        case 'm':
          now.setMinutes(now.getMinutes() - num);
          break;
      }
    }
  }
  
  return now.toISOString();
};

export function DateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform database dates to DateEntry format
  const transformDate = (dbDate: any): DateEntry => {
    // Calculate relative time
    const createdAt = new Date(dbDate.created_at);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let relativeTime: string;
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      relativeTime = `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays}d ago`;
    } else {
      relativeTime = createdAt.toLocaleDateString();
    }

    return {
      id: dbDate.id,
      personName: dbDate.person_name,
      date: relativeTime,
      location: dbDate.location,
      rating: dbDate.rating,
      notes: dbDate.notes,
      tags: dbDate.tags,
      circles: dbDate.shared_circles,
      isPrivate: dbDate.is_private,
      imageUri: dbDate.image_uri,
      comments: dbDate.comments || [],
      likeCount: dbDate.like_count,
      commentCount: dbDate.comment_count,
      isLiked: dbDate.isLiked || false,
      authorName: dbDate.authorName,
      authorAvatar: dbDate.authorAvatar,
      createdAt: dbDate.created_at,
      updatedAt: dbDate.updated_at,
      isOwnPost: dbDate.user_id === user?.id,
    };
  };

  // Transform database plans to PlanEntry format
  const transformPlan = (dbPlan: any): PlanEntry => {
    return {
      id: dbPlan.id,
      personName: dbPlan.person_name,
      date: formatDateForDisplay(dbPlan.date),
      rawDate: dbPlan.date,
      time: dbPlan.time,
      location: dbPlan.location,
      content: dbPlan.notes,
      tags: dbPlan.tags,
      authorName: dbPlan.user?.name || 'Unknown',
      authorAvatar: dbPlan.user?.image_uri,
      createdAt: dbPlan.created_at,
      isCompleted: dbPlan.is_completed,
      likeCount: 0, // TODO: Implement plan likes
      commentCount: 0, // TODO: Implement plan comments
      isLiked: false,
      comments: [],
    };
  };

  // Load dates from Supabase
  const loadDates = async () => {
    if (!user) {
      setDates([]);
      setPlans([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get dates and plans
      const [dbDates, dbPlans] = await Promise.all([
        DateService.getDates(user.id),
        DateService.getPlans(user.id),
      ]);
      
      // Transform and set dates
      const transformedDates = dbDates.map(transformDate);
      const transformedPlans = dbPlans.map(transformPlan);
      
      setDates(transformedDates);
      setPlans(transformedPlans);
    } catch (err) {
      console.error('Error loading dates:', err);
      setError('Failed to load dates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDates();
  }, [user]);

  const addDate = async (formData: DateEntryFormData) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      let imageUrl = formData.imageUri;
      
      // Upload image to Supabase storage if it's a local file
      if (imageUrl && imageUrl.startsWith('file://')) {
        try {
          const uploadResult = await StorageService.uploadDateEntryImage(imageUrl, user.id);
          imageUrl = uploadResult.fullUrl;
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          // Continue without image if upload fails
          imageUrl = '';
        }
      }
      
      // Create date with uploaded image URL
      const dateData = { ...formData, imageUri: imageUrl };
      await DateService.createDate(dateData, user.id);
      
      // Refresh dates after adding
      await loadDates();
    } catch (err) {
      console.error('Error adding date:', err);
      setError('Failed to add date');
      throw err;
    }
  };

  const addPlan = async (formData: PlanFormData, personName: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await DateService.createPlan(formData, personName, user.id);
      // Refresh dates after adding
      await loadDates();
    } catch (err) {
      console.error('Error adding plan:', err);
      setError('Failed to add plan');
      throw err;
    }
  };

  const completePlan = async (planId: string, dateData: DateEntryFormData) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await DateService.completePlan(planId, dateData, user.id);
      // Refresh dates after completing
      await loadDates();
    } catch (err) {
      console.error('Error completing plan:', err);
      setError('Failed to complete plan');
      throw err;
    }
  };

  const updateDate = async (id: string, updates: Partial<DateEntry>) => {
    try {
      // Transform DateEntry updates to database format
      const dbUpdates: any = {};
      if (updates.personName !== undefined) dbUpdates.person_name = updates.personName;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.circles !== undefined) dbUpdates.shared_circles = updates.circles;
      if (updates.isPrivate !== undefined) dbUpdates.is_private = updates.isPrivate;
      if (updates.imageUri !== undefined) dbUpdates.image_uri = updates.imageUri;
      
      await DateService.updateDate(id, dbUpdates);
      // Refresh dates after updating
      await loadDates();
    } catch (err) {
      console.error('Error updating date:', err);
      setError('Failed to update date');
      throw err;
    }
  };

  const deleteDate = async (id: string) => {
    try {
      await DateService.deleteDate(id);
      // Refresh dates after deleting
      await loadDates();
    } catch (err) {
      console.error('Error deleting date:', err);
      setError('Failed to delete date');
      throw err;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await DateService.deletePlan(id);
      // Refresh dates after deleting
      await loadDates();
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete plan');
      throw err;
    }
  };

  const likeDate = async (id: string) => {
    if (!user) return;
    
    try {
      await DateService.likeDate(id, user.id);
      // Refresh dates after liking
      await loadDates();
    } catch (err) {
      console.error('Error liking date:', err);
      setError('Failed to like date');
    }
  };

  const likePlan = async (id: string) => {
    if (!user) return;
    
    try {
      await DateService.likePlan(id, user.id);
      // Refresh dates after liking
      await loadDates();
    } catch (err) {
      console.error('Error liking plan:', err);
      setError('Failed to like plan');
    }
  };

  const addComment = async (id: string, comment: { name: string; content: string }) => {
    if (!user) return;
    
    try {
      await DateService.addComment(id, comment, user.id);
      // Refresh dates after commenting
      await loadDates();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const addPlanComment = async (id: string, comment: { name: string; content: string }) => {
    if (!user) return;
    
    try {
      await DateService.addPlanComment(id, comment, user.id);
      // Refresh dates after commenting
      await loadDates();
    } catch (err) {
      console.error('Error adding plan comment:', err);
      setError('Failed to add comment');
    }
  };

  const voteOnPoll = async (id: string, optionIndex: number) => {
    if (!user) return;
    
    try {
      await DateService.voteOnPoll(id, optionIndex, user.id);
      // Refresh dates after voting
      await loadDates();
    } catch (err) {
      console.error('Error voting on poll:', err);
      setError('Failed to vote on poll');
    }
  };

  const refreshDates = async () => {
    await loadDates();
  };

  const value = {
    dates,
    plans,
    addDate,
    addPlan,
    completePlan,
    updateDate,
    deleteDate,
    deletePlan,
    likeDate,
    likePlan,
    addComment,
    addPlanComment,
    voteOnPoll,
    refreshDates,
    isLoading,
    error,
  };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function useDates() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDates must be used within a DateProvider');
  }
  return context;
}