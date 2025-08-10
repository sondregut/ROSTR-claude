import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DateService } from '@/services/supabase/dates';
import { StorageService } from '@/services/supabase/storage';
import { DateEntryFormData } from '@/components/ui/forms/DateEntryForm';
import { PlanFormData } from '@/components/ui/modals/AddPlanModal';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
    imageUri?: string;
  }>;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  reactions?: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
  userReaction?: string | null;
  authorName: string; // The user who created this entry
  authorUsername?: string; // Username for navigation
  authorAvatar?: string;
  createdAt: string; // ISO timestamp for sorting
  updatedAt: string;
  isOwnPost?: boolean; // Whether this post belongs to the current user
  entryType?: 'date' | 'roster_addition' | 'plan'; // Type of feed entry
  rosterInfo?: {
    age?: number;
    occupation?: string;
    howWeMet?: string;
    interests?: string;
    instagram?: string;
    phone?: string;
    photos?: string[];
  };
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
  reactions?: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
  userReaction?: string | null;
  comments: Array<{
    name: string;
    content: string;
    imageUri?: string;
  }>;
}

interface DateContextType {
  dates: DateEntry[];
  plans: PlanEntry[];
  hasNewPosts: boolean;
  loadNewPosts: () => Promise<void>;
  addDate: (formData: DateEntryFormData) => Promise<void>;
  addRosterAddition: (personName: string, rosterInfo: any, circles: string[], isPrivate: boolean) => Promise<void>;
  updateRosterAddition: (id: string, updates: any) => Promise<void>;
  deleteRosterAddition: (id: string) => Promise<void>;
  addPlan: (formData: PlanFormData, personName: string) => Promise<void>;
  completePlan: (planId: string, dateData: DateEntryFormData) => Promise<void>;
  updatePlan: (id: string, updates: Partial<PlanEntry>) => Promise<void>;
  updateDate: (id: string, updates: Partial<DateEntry>) => Promise<void>;
  deleteDate: (id: string) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  likeDate: (id: string) => Promise<void>;
  likePlan: (id: string) => Promise<void>;
  reactToDate: (id: string, reaction: string | null) => Promise<void>;
  reactToPlan: (id: string, reaction: string | null) => Promise<void>;
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
  const auth = useSafeAuth();
  const user = auth?.user;
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const channelsRef = useRef<RealtimeChannel[]>([]);

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
      location: dbDate.location || '',
      rating: dbDate.rating || 0,
      notes: dbDate.notes || '',
      tags: dbDate.tags || [],
      circles: dbDate.shared_circles || [],
      isPrivate: dbDate.is_private || false,
      imageUri: dbDate.entry_type === 'roster_addition' && dbDate.roster_info?.photos?.[0] 
        ? dbDate.roster_info.photos[0] 
        : dbDate.image_uri,
      poll: dbDate.poll,
      userPollVote: dbDate.userPollVote,
      comments: dbDate.comments || [],
      likeCount: dbDate.like_count || 0,
      commentCount: dbDate.comment_count || 0,
      isLiked: dbDate.isLiked || false,
      reactions: dbDate.reactions || {},
      userReaction: dbDate.userReaction || null,
      authorName: dbDate.authorName || 'Unknown',
      authorUsername: dbDate.authorUsername,
      authorAvatar: dbDate.authorAvatar,
      createdAt: dbDate.created_at,
      updatedAt: dbDate.updated_at,
      isOwnPost: dbDate.user_id === user?.id,
      entryType: dbDate.entry_type || 'date',
      rosterInfo: dbDate.roster_info ? {
        age: dbDate.roster_info.age,
        occupation: dbDate.roster_info.occupation,
        howWeMet: dbDate.roster_info.how_we_met,
        interests: dbDate.roster_info.interests,
        instagram: dbDate.roster_info.instagram,
        phone: dbDate.roster_info.phone,
        photos: dbDate.roster_info.photos,
      } : undefined,
    };
  };

  // Transform database plans to PlanEntry format
  const transformPlan = (dbPlan: any): PlanEntry & { user_id?: string; authorUsername?: string } => {
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
      authorUsername: dbPlan.user?.username,
      authorAvatar: dbPlan.user?.image_uri,
      createdAt: dbPlan.created_at,
      isCompleted: dbPlan.is_completed,
      likeCount: dbPlan.likeCount || 0,
      commentCount: dbPlan.commentCount || 0,
      isLiked: dbPlan.isLiked || false,
      reactions: dbPlan.reactions || {},
      userReaction: dbPlan.userReaction || null,
      comments: dbPlan.comments || [],
      user_id: dbPlan.user_id, // Pass through user_id for ownership check
    };
  };

  // Load dates from Supabase
  const loadDates = async (isRefresh = false) => {
    if (!user) {
      setDates([]);
      setPlans([]);
      setIsLoading(false);
      return;
    }

    try {
      // Only show loading state if not refreshing or if there's no existing data
      if (!isRefresh || dates.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      
      // Get dates and plans
      const [dbDates, dbPlans] = await Promise.all([
        DateService.getDates(user.id),
        DateService.getPlans(user.id),
      ]);
      
      // Transform dates and plans
      const transformedDates = dbDates.map(transformDate);
      const transformedPlans = dbPlans.map(transformPlan);
      
      // Convert plans to DateEntry format for the feed
      const planFeedEntries = transformedPlans.map(plan => ({
        id: plan.id,
        personName: plan.personName,
        date: plan.date,
        location: plan.location,
        rating: 0,
        notes: plan.content || '',
        tags: plan.tags,
        circles: [],
        isPrivate: false,
        imageUri: '',
        poll: undefined,
        userPollVote: null,
        comments: plan.comments,
        likeCount: plan.likeCount,
        commentCount: plan.commentCount,
        isLiked: plan.isLiked,
        authorName: plan.authorName,
        authorUsername: plan.authorUsername,
        authorAvatar: plan.authorAvatar,
        createdAt: plan.createdAt,
        updatedAt: plan.createdAt,
        isOwnPost: plan.user_id === user.id, // Properly check ownership
        entryType: 'plan' as const,
        // Plan-specific fields
        time: plan.time,
        content: plan.content,
        rawDate: plan.rawDate,
        isCompleted: plan.isCompleted,
      }));
      
      // Combine dates and plans for the feed, sorted by creation time
      const combinedFeedEntries = [...transformedDates, ...planFeedEntries]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setDates(combinedFeedEntries);
      setPlans(transformedPlans);
    } catch (err) {
      console.error('Error loading dates:', err);
      setError('Failed to load dates');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!user) {
      console.log('⚠️ Skipping subscriptions setup - no user');
      return;
    }

    console.log('🔄 Setting up real-time feed subscriptions');
    
    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
    });
    channelsRef.current = [];

    // Subscribe to date entries changes
    try {
      const dateEntriesChannel = supabase
        .channel('feed-date-entries')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'date_entries',
          },
          async (payload) => {
            try {
              // Validate user still exists
              if (!user?.id) {
                console.warn('User no longer exists, skipping date entries update');
                return;
              }
              
              console.log('📨 Date entries change:', payload.eventType);
              
              if (payload.eventType === 'INSERT') {
                // Show new posts indicator if not user's own post
                if (payload.new?.user_id && payload.new.user_id !== user.id) {
                  setHasNewPosts(true);
                } else {
                  // If it's user's own post, refresh immediately
                  await loadDates();
                }
              } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                // Refresh for updates and deletes
                await loadDates();
              }
            } catch (error) {
              console.error('Error handling date entries change:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error('Date entries subscription error');
            setError('Connection issue - some updates may be delayed');
          }
        });
      
      if (dateEntriesChannel) {
        channelsRef.current.push(dateEntriesChannel);
      }
    } catch (error) {
      console.error('Failed to setup date entries subscription:', error);
    }

    // Subscribe to likes changes
    try {
      const likesChannel = supabase
        .channel('feed-likes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'date_likes',
          },
          async (payload) => {
            try {
              // Validate user still exists
              if (!user?.id) {
                console.warn('User no longer exists, skipping likes update');
                return;
              }
              
              console.log('❤️ Likes change:', payload.eventType);
              
              // Only update the specific date entry's like status instead of refreshing entire feed
              if (payload.eventType === 'INSERT' && payload.new) {
                const dateId = payload.new.date_id || payload.new.date_entry_id;
                const userId = payload.new.user_id;
                
                if (dateId) {
                  setDates(prevDates => 
                    prevDates.map(date => 
                      date.id === dateId
                        ? { 
                            ...date, 
                            likeCount: (date.likeCount || 0) + 1,
                            isLiked: userId === user.id ? true : date.isLiked
                          }
                        : date
                    )
                  );
                }
              } else if (payload.eventType === 'DELETE' && payload.old) {
                const dateId = payload.old.date_id || payload.old.date_entry_id;
                const userId = payload.old.user_id;
                
                if (dateId) {
                  setDates(prevDates => 
                    prevDates.map(date => 
                      date.id === dateId
                        ? { 
                            ...date, 
                            likeCount: Math.max((date.likeCount || 0) - 1, 0),
                            isLiked: userId === user.id ? false : date.isLiked
                          }
                        : date
                    )
                  );
                }
              }
            } catch (error) {
              console.error('Error handling likes change:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error('Likes subscription error');
          }
        });
      
      if (likesChannel) {
        channelsRef.current.push(likesChannel);
      }
    } catch (error) {
      console.error('Failed to setup likes subscription:', error);
    }

    // Subscribe to comments changes
    try {
      const commentsChannel = supabase
        .channel('feed-comments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'date_comments',
          },
          async (payload) => {
            try {
              console.log('💬 Comments change:', payload.eventType);
              
              // Only update the specific date entry's comments instead of refreshing entire feed
              if (payload.eventType === 'INSERT' && payload.new) {
                const dateId = payload.new.date_id || payload.new.date_entry_id;
                
                if (dateId) {
                  // Update only the specific date's comment count
                  setDates(prevDates => 
                    prevDates.map(date => 
                      date.id === dateId
                        ? { ...date, commentCount: (date.commentCount || 0) + 1 }
                        : date
                    )
                  );
                }
              } else if (payload.eventType === 'DELETE' && payload.old) {
                const dateId = payload.old.date_id || payload.old.date_entry_id;
                
                if (dateId) {
                  // Update only the specific date's comment count
                  setDates(prevDates => 
                    prevDates.map(date => 
                      date.id === dateId
                        ? { ...date, commentCount: Math.max((date.commentCount || 0) - 1, 0) }
                        : date
                    )
                  );
                }
              }
            } catch (error) {
              console.error('Error handling comments change:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error('Comments subscription error');
          }
        });
      
      if (commentsChannel) {
        channelsRef.current.push(commentsChannel);
      }
    } catch (error) {
      console.error('Failed to setup comments subscription:', error);
    }

    // Subscribe to plans changes
    try {
      const plansChannel = supabase
        .channel('feed-plans')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'date_plans',
          },
          async (payload) => {
            try {
              // Validate user still exists
              if (!user?.id) {
                console.warn('User no longer exists, skipping plans update');
                return;
              }
              
              console.log('📅 Plans change:', payload.eventType);
              
              // For plans, we need to handle INSERT, UPDATE, and DELETE differently
              // Only reload if it's from another user to avoid disrupting the feed
              if (payload.new?.user_id !== user.id && payload.old?.user_id !== user.id) {
                // Only refresh if it's someone else's plan
                await loadDates();
              }
            } catch (error) {
              console.error('Error handling plans change:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error('Plans subscription error');
          }
        });
      
      if (plansChannel) {
        channelsRef.current.push(plansChannel);
      }
    } catch (error) {
      console.error('Failed to setup plans subscription:', error);
    }

    // Subscribe to poll votes
    try {
      const pollsChannel = supabase
        .channel('feed-polls')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'poll_votes',
          },
          async (payload) => {
            try {
              // Validate user still exists
              if (!user?.id) {
                console.warn('User no longer exists, skipping poll update');
                return;
              }
              
              console.log('📊 Poll votes change:', payload.eventType);
              
              // For poll votes, we need to reload the poll data for the specific date
              // But only update that specific date entry, not the entire feed
              if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
                const pollId = payload.new.poll_id;
                
                if (pollId) {
                  // Find which date contains this poll
                  const dateWithPoll = dates.find(date => date.poll?.id === pollId);
                  if (dateWithPoll) {
                    try {
                      // Fetch updated poll data
                      const { data: updatedPoll } = await supabase
                        .from('polls')
                        .select(`
                          *,
                          options:poll_options (
                            id,
                            text,
                            vote_count
                          ),
                          votes:poll_votes (
                            user_id,
                            option_id
                          )
                        `)
                        .eq('id', pollId)
                        .single();
                      
                      if (updatedPoll) {
                        setDates(prevDates => 
                          prevDates.map(date => 
                            date.id === dateWithPoll.id
                              ? { 
                                  ...date, 
                                  poll: updatedPoll,
                                  userPollVote: updatedPoll.votes?.find(v => v.user_id === user.id)?.option_id
                                }
                              : date
                          )
                        );
                      }
                    } catch (error) {
                      console.error('Error updating poll data:', error);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error handling poll votes change:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error('Polls subscription error');
          }
        });
      
      if (pollsChannel) {
        channelsRef.current.push(pollsChannel);
      }
    } catch (error) {
      console.error('Failed to setup polls subscription:', error);
    }
  };

  // Load when new posts indicator is clicked
  const loadNewPosts = async () => {
    setHasNewPosts(false);
    await loadDates();
  };

  useEffect(() => {
    if (user) {
      loadDates();
      setupRealtimeSubscriptions();
    } else {
      setDates([]);
      setPlans([]);
      setIsLoading(false);
    }

    // Cleanup on unmount or user change
    return () => {
      console.log('🧹 Cleaning up DateContext subscriptions');
      channelsRef.current.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel during cleanup:', error);
        }
      });
      channelsRef.current = [];
    };
  }, [user]);

  const addDate = async (formData: DateEntryFormData) => {
    if (!user) {
      const error = new Error('No user logged in');
      console.error('addDate error:', error);
      setError('You must be logged in to add dates');
      throw error;
    }
    
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

  const addRosterAddition = async (personName: string, rosterInfo: any, circles: string[] = [], isPrivate: boolean = false) => {
    if (!user) {
      const error = new Error('No user logged in');
      console.error('addRosterAddition error:', error);
      setError('You must be logged in to add roster entries');
      throw error;
    }
    
    try {
      await DateService.createRosterAddition(personName, rosterInfo, user.id, circles, isPrivate);
      // Refresh dates after adding
      await loadDates();
    } catch (err) {
      console.error('Error adding roster addition:', err);
      setError('Failed to add roster addition');
      throw err;
    }
  };

  const addPlan = async (formData: PlanFormData, personName: string) => {
    if (!user) {
      const error = new Error('No user logged in');
      console.error('addPlan error:', error);
      setError('You must be logged in to add plans');
      throw error;
    }
    
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
    if (!user) {
      const error = new Error('No user logged in');
      console.error('completePlan error:', error);
      setError('You must be logged in to complete plans');
      throw error;
    }
    
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

  const updatePlan = async (id: string, updates: Partial<PlanEntry>) => {
    try {
      // Transform PlanEntry updates to database format
      const dbUpdates: any = {};
      if (updates.personName !== undefined) dbUpdates.person_name = updates.personName;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.content !== undefined) dbUpdates.notes = updates.content;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
      if (updates.rawDate !== undefined) dbUpdates.date = updates.rawDate;
      if (updates.time !== undefined) dbUpdates.time = updates.time;
      
      await DateService.updatePlan(id, dbUpdates);
      // Refresh dates after updating
      await loadDates();
    } catch (err) {
      console.error('Error updating plan:', err);
      setError('Failed to update plan');
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
    if (!user) {
      console.warn('likeDate called without user');
      return;
    }
    
    console.log('🔍 DateContext: likeDate called with id:', id);
    
    // Find the entry to check its type
    const entry = dates.find(d => d.id === id);
    if (!entry) {
      console.error('❌ DateContext: Entry not found with id:', id);
      return;
    }
    
    console.log('🔍 DateContext: Found entry:', { 
      id: entry.id, 
      personName: entry.personName, 
      entryType: entry.entryType,
      isLiked: entry.isLiked,
      likeCount: entry.likeCount
    });
    
    try {
      // Optimistically update UI
      setDates(prevDates => 
        prevDates.map(date => 
          date.id === id 
            ? {
                ...date,
                isLiked: !date.isLiked,
                likeCount: date.isLiked ? date.likeCount - 1 : date.likeCount + 1,
              }
            : date
        )
      );
      
      // Send like to server - this works for all entry types since they all use date_entries table
      await DateService.likeDate(id, user.id);
      console.log('✅ DateContext: Like successfully sent to server');
      
    } catch (err) {
      console.error('❌ DateContext: Error liking date:', err);
      
      // Revert optimistic update on failure
      setDates(prevDates => 
        prevDates.map(date => 
          date.id === id 
            ? {
                ...date,
                isLiked: !date.isLiked,
                likeCount: date.isLiked ? date.likeCount - 1 : date.likeCount + 1,
              }
            : date
        )
      );
      
      setError('Failed to like date');
    }
  };

  const likePlan = async (id: string) => {
    if (!user) {
      console.warn('likePlan called without user');
      return;
    }
    
    try {
      // Optimistically update UI
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === id 
            ? {
                ...plan,
                isLiked: !plan.isLiked,
                likeCount: plan.isLiked ? plan.likeCount - 1 : plan.likeCount + 1,
              }
            : plan
        )
      );
      
      // Send like to server
      await DateService.likePlan(id, user.id);
      
    } catch (err) {
      console.error('Error liking plan:', err);
      
      // Revert optimistic update on failure
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === id 
            ? {
                ...plan,
                isLiked: !plan.isLiked,
                likeCount: plan.isLiked ? plan.likeCount - 1 : plan.likeCount + 1,
              }
            : plan
        )
      );
      
      setError('Failed to like plan');
    }
  };

  const reactToDate = async (id: string, reaction: string | null) => {
    if (!user) {
      console.warn('reactToDate called without user');
      return;
    }
    
    console.log('🔍 DateContext: reactToDate called with:', { id, reaction });
    
    // Find the entry to get current reaction state
    const entry = dates.find(d => d.id === id);
    if (!entry) {
      console.error('❌ DateContext: Entry not found with id:', id);
      return;
    }
    
    const oldReaction = entry.userReaction;
    
    try {
      // Optimistically update UI
      setDates(prevDates => 
        prevDates.map(date => {
          if (date.id !== id) return date;
          
          const newReactions = { ...date.reactions };
          const totalReactionCount = Object.values(newReactions || {})
            .reduce((sum, r) => sum + (r?.count || 0), 0);
          
          // Remove old reaction
          if (oldReaction && newReactions[oldReaction]) {
            newReactions[oldReaction] = {
              ...newReactions[oldReaction],
              count: Math.max(0, newReactions[oldReaction].count - 1),
              users: newReactions[oldReaction].users.filter(u => u !== user.id)
            };
            if (newReactions[oldReaction].count === 0) {
              delete newReactions[oldReaction];
            }
          }
          
          // Add new reaction
          if (reaction) {
            if (!newReactions[reaction]) {
              newReactions[reaction] = { count: 0, users: [] };
            }
            newReactions[reaction] = {
              count: newReactions[reaction].count + 1,
              users: [...newReactions[reaction].users, user.id]
            };
          }
          
          const newTotalCount = Object.values(newReactions)
            .reduce((sum, r) => sum + (r?.count || 0), 0);
          
          return {
            ...date,
            userReaction: reaction,
            reactions: newReactions,
            // Update legacy like fields for backward compatibility
            isLiked: reaction === 'love',
            likeCount: newTotalCount,
          };
        })
      );
      
      // Send reaction to server
      await DateService.reactToDate(id, reaction, user.id);
      console.log('✅ DateContext: Reaction successfully sent to server');
      
    } catch (err) {
      console.error('❌ DateContext: Error reacting to date:', err);
      
      // Revert optimistic update on failure
      setDates(prevDates => 
        prevDates.map(date => 
          date.id === id 
            ? { ...date, userReaction: oldReaction }
            : date
        )
      );
      
      setError('Failed to react to date');
    }
  };

  const reactToPlan = async (id: string, reaction: string | null) => {
    if (!user) {
      console.warn('reactToPlan called without user');
      return;
    }
    
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    
    const oldReaction = plan.userReaction;
    
    try {
      // Optimistically update UI
      setPlans(prevPlans => 
        prevPlans.map(plan => {
          if (plan.id !== id) return plan;
          
          const newReactions = { ...plan.reactions };
          
          // Remove old reaction
          if (oldReaction && newReactions[oldReaction]) {
            newReactions[oldReaction] = {
              ...newReactions[oldReaction],
              count: Math.max(0, newReactions[oldReaction].count - 1),
              users: newReactions[oldReaction].users.filter(u => u !== user.id)
            };
            if (newReactions[oldReaction].count === 0) {
              delete newReactions[oldReaction];
            }
          }
          
          // Add new reaction
          if (reaction) {
            if (!newReactions[reaction]) {
              newReactions[reaction] = { count: 0, users: [] };
            }
            newReactions[reaction] = {
              count: newReactions[reaction].count + 1,
              users: [...newReactions[reaction].users, user.id]
            };
          }
          
          const newTotalCount = Object.values(newReactions)
            .reduce((sum, r) => sum + (r?.count || 0), 0);
          
          return {
            ...plan,
            userReaction: reaction,
            reactions: newReactions,
            isLiked: reaction === 'love',
            likeCount: newTotalCount,
          };
        })
      );
      
      // Send reaction to server
      await DateService.reactToPlan(id, reaction, user.id);
      
    } catch (err) {
      console.error('Error reacting to plan:', err);
      
      // Revert optimistic update on failure
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === id 
            ? { ...plan, userReaction: oldReaction }
            : plan
        )
      );
      
      setError('Failed to react to plan');
    }
  };

  const addComment = async (id: string, comment: { name: string; content: string }) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    // Create optimistic comment with temporary ID
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      name: comment.name,
      content: comment.content,
      isOptimistic: true,
    };

    try {
      // Optimistically update UI immediately
      setDates(prevDates => 
        prevDates.map(date => 
          date.id === id 
            ? {
                ...date,
                comments: [...(date.comments || []), optimisticComment],
                commentCount: date.commentCount + 1,
              }
            : date
        )
      );

      // Send comment to server
      await DateService.addComment(id, comment, user.id);

      // Replace optimistic comment with confirmed state
      setDates(prevDates => 
        prevDates.map(date => 
          date.id === id 
            ? {
                ...date,
                comments: date.comments.map(c => 
                  c.id === optimisticComment.id 
                    ? { ...c, isOptimistic: false, id: `confirmed-${Date.now()}` }
                    : c
                ),
              }
            : date
        )
      );
      
    } catch (err) {
      console.error('Error adding comment:', err);
      
      // Remove optimistic comment on failure
      setDates(prevDates => 
        prevDates.map(date => 
          date.id === id 
            ? {
                ...date,
                comments: date.comments.filter(c => c.id !== optimisticComment.id),
                commentCount: Math.max(0, date.commentCount - 1),
              }
            : date
        )
      );
      
      setError('Failed to add comment');
      throw err;
    }
  };

  const addPlanComment = async (id: string, comment: { name: string; content: string }) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    // Create optimistic comment with temporary ID
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      name: comment.name,
      content: comment.content,
      isOptimistic: true,
    };

    try {
      // Optimistically update UI immediately
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === id 
            ? {
                ...plan,
                comments: [...(plan.comments || []), optimisticComment],
                commentCount: plan.commentCount + 1,
              }
            : plan
        )
      );

      // Send comment to server
      await DateService.addPlanComment(id, comment, user.id);

      // Replace optimistic comment with confirmed state
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === id 
            ? {
                ...plan,
                comments: plan.comments.map(c => 
                  c.id === optimisticComment.id 
                    ? { ...c, isOptimistic: false, id: `confirmed-${Date.now()}` }
                    : c
                ),
              }
            : plan
        )
      );
      
    } catch (err) {
      console.error('Error adding plan comment:', err);
      
      // Remove optimistic comment on failure
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan.id === id 
            ? {
                ...plan,
                comments: plan.comments.filter(c => c.id !== optimisticComment.id),
                commentCount: Math.max(0, plan.commentCount - 1),
              }
            : plan
        )
      );
      
      setError('Failed to add comment');
      throw err;
    }
  };

  const voteOnPoll = async (id: string, optionIndex: number) => {
    if (!user) {
      console.warn('voteOnPoll called without user');
      return;
    }
    
    try {
      await DateService.voteOnPoll(id, optionIndex, user.id);
      // Refresh dates after voting
      await loadDates();
    } catch (err) {
      console.error('Error voting on poll:', err);
      setError('Failed to vote on poll');
    }
  };

  const updateRosterAddition = async (id: string, updates: any) => {
    if (!user) {
      const error = new Error('No user logged in');
      console.error('updateRosterAddition error:', error);
      setError('You must be logged in to update roster entries');
      throw error;
    }
    
    try {
      await DateService.updateRosterAddition(id, updates);
      // Refresh dates after updating
      await loadDates();
    } catch (err) {
      console.error('Error updating roster addition:', err);
      setError('Failed to update roster addition');
      throw err;
    }
  };

  const deleteRosterAddition = async (id: string) => {
    try {
      await DateService.deleteRosterAddition(id);
      // Refresh dates after deleting
      await loadDates();
    } catch (err) {
      console.error('Error deleting roster addition:', err);
      setError('Failed to delete roster addition');
      throw err;
    }
  };

  const refreshDates = async () => {
    await loadDates(true);
  };

  const value = {
    dates,
    plans,
    hasNewPosts,
    loadNewPosts,
    addDate,
    addRosterAddition,
    updateRosterAddition,
    deleteRosterAddition,
    addPlan,
    completePlan,
    updatePlan,
    updateDate,
    deleteDate,
    deletePlan,
    likeDate,
    likePlan,
    reactToDate,
    reactToPlan,
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