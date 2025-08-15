import React, { createContext, useContext, useState, useEffect } from 'react';
import { RosterService, RosterEntry as DbRosterEntry } from '@/services/supabase/roster';
import { DateService } from '@/services/supabase/dates';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useDates } from '@/contexts/DateContext';
import { uploadImageToSupabase } from '@/lib/photoUpload';

// UI-friendly roster entry type
export interface RosterEntry {
  id: string;
  name: string;
  lastDate: string;
  nextDate?: string;
  rating: number;
  status: 'active' | 'new' | 'fading' | 'ended' | 'ghosted';
  age?: number;
  occupation?: string;
  location?: string;
  how_we_met?: string;
  interests?: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  photos?: string[];
}

interface RosterContextType {
  activeRoster: RosterEntry[];
  pastConnections: RosterEntry[];
  isLoading: boolean;
  error: string | null;
  addPerson: (name: string, personData?: any) => Promise<void>;
  updateEntry: (id: string, updates: Partial<RosterEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refreshRoster: () => Promise<void>;
  stats: {
    totalEntries: number;
    activeCount: number;
    averageRating: number;
  };
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

// Transform database entry to UI format
const transformRosterEntry = (dbEntry: DbRosterEntry): RosterEntry => {
  // Format dates for display
  let lastDate = 'Never';
  if (dbEntry.last_date) {
    const date = new Date(dbEntry.last_date);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      lastDate = 'Today';
    } else if (diffDays === 1) {
      lastDate = 'Yesterday';
    } else if (diffDays < 7) {
      lastDate = `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      lastDate = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      lastDate = `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }

  let nextDate: string | undefined;
  if (dbEntry.next_date) {
    const date = new Date(dbEntry.next_date);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === now.toDateString()) {
      nextDate = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      nextDate = 'Tomorrow';
    } else {
      nextDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  return {
    id: dbEntry.id,
    name: dbEntry.name,
    lastDate,
    nextDate,
    rating: dbEntry.rating,
    status: dbEntry.status,
    age: dbEntry.age,
    occupation: dbEntry.occupation,
    location: dbEntry.location,
    how_we_met: dbEntry.how_we_met,
    interests: dbEntry.interests,
    phone: dbEntry.phone,
    instagram: dbEntry.instagram,
    notes: dbEntry.notes,
    photos: dbEntry.photos || [],
  };
};

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const auth = useSafeAuth();
  const user = auth?.user;
  const { addRosterAddition, refreshDates } = useDates();
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEntries: 0,
    activeCount: 0,
    averageRating: 0,
  });

  // Separate active and past connections
  const activeRoster = entries.filter(e => 
    e.status === 'active' || e.status === 'new' || e.status === 'fading'
  );
  const pastConnections = entries.filter(e => 
    e.status === 'ended' || e.status === 'ghosted'
  );

  // Load roster entries
  const loadRoster = async (isRefresh = false) => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      // Only show loading state if not refreshing or if there's no existing data
      if (!isRefresh || entries.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      
      // Load entries and stats in parallel
      const [dbEntries, rosterStats] = await Promise.all([
        RosterService.getRosterEntries(user.id),
        RosterService.getRosterStats(user.id),
      ]);
      
      // Transform entries for UI
      const transformedEntries = dbEntries.map(transformRosterEntry);
      
      setEntries(transformedEntries);
      setStats(rosterStats);
    } catch (err) {
      console.error('Error loading roster:', err);
      setError('Failed to load roster');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [user]);

  const addPerson = async (name: string, personData?: any) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // If personData is a string, it's the old notes parameter
      const entry = typeof personData === 'string' 
        ? { name, notes: personData }
        : { name, ...personData };
      
      // Upload photos to Supabase if they are local file URIs
      if (entry.photos && Array.isArray(entry.photos)) {
        const uploadedPhotos: string[] = [];
        
        for (const photo of entry.photos) {
          if (photo && photo.startsWith('file://')) {
            try {
              console.log('[RosterContext] Uploading roster photo to Supabase...');
              const uploadResult = await uploadImageToSupabase(
                photo,
                user.id,
                'user-photos' // Using user-photos bucket for roster photos
              );
              
              if (uploadResult.success && uploadResult.url) {
                console.log('[RosterContext] Photo uploaded successfully:', uploadResult.url);
                uploadedPhotos.push(uploadResult.url);
              } else {
                console.error('[RosterContext] Photo upload failed:', uploadResult.error);
                // Keep the local URI as fallback
                uploadedPhotos.push(photo);
              }
            } catch (error) {
              console.error('[RosterContext] Error uploading photo:', error);
              // Keep the local URI as fallback
              uploadedPhotos.push(photo);
            }
          } else {
            // Already a URL or empty, keep as is
            uploadedPhotos.push(photo);
          }
        }
        
        // Update entry with uploaded photo URLs
        entry.photos = uploadedPhotos;
      }
        
      await RosterService.addRosterEntry(user.id, entry);
      
      // Create a feed entry for the roster addition
      try {
        await addRosterAddition(name, entry, entry.circles || [], entry.isPrivate || false);
      } catch (feedError) {
        console.error('Failed to create feed entry:', feedError);
        // Don't throw here - we still want the roster addition to succeed
      }
      
      // Refresh roster after adding
      await loadRoster();
    } catch (err) {
      console.error('Error adding person:', err);
      setError('Failed to add person');
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<RosterEntry>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Find the current entry to get the person's name before updates
      const currentEntry = entries.find(e => e.id === id);
      if (!currentEntry) throw new Error('Entry not found');
      
      // If only updating status, do optimistic update
      if (Object.keys(updates).length === 1 && updates.status !== undefined) {
        const oldStatus = currentEntry.status;
        
        // Optimistically update the local state
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            entry.id === id 
              ? { ...entry, status: updates.status! }
              : entry
          )
        );
        
        try {
          // Update in database
          await RosterService.updateRosterEntry(id, { status: updates.status });
          
          // Sync to feed entries
          try {
            await DateService.syncRosterToFeedEntries(user.id, currentEntry.name, { status: updates.status });
          } catch (syncError) {
            console.error('Failed to sync roster changes to feed:', syncError);
          }
        } catch (err) {
          // Revert optimistic update on failure
          setEntries(prevEntries => 
            prevEntries.map(entry => 
              entry.id === id 
                ? { ...entry, status: oldStatus }
                : entry
            )
          );
          throw err;
        }
        
        return; // Don't reload for status-only updates
      }
      
      // Transform UI updates to database format
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.how_we_met !== undefined) dbUpdates.how_we_met = updates.how_we_met;
      if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
      if (updates.instagram !== undefined) dbUpdates.instagram = updates.instagram;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      
      // Handle photo uploads
      if (updates.photos !== undefined) {
        const uploadedPhotos: string[] = [];
        
        for (const photo of updates.photos) {
          if (photo && photo.startsWith('file://')) {
            try {
              console.log('[RosterContext] Uploading updated roster photo to Supabase...');
              const uploadResult = await uploadImageToSupabase(
                photo,
                user.id,
                'user-photos'
              );
              
              if (uploadResult.success && uploadResult.url) {
                console.log('[RosterContext] Photo uploaded successfully:', uploadResult.url);
                uploadedPhotos.push(uploadResult.url);
              } else {
                console.error('[RosterContext] Photo upload failed:', uploadResult.error);
                uploadedPhotos.push(photo); // Keep local URI as fallback
              }
            } catch (error) {
              console.error('[RosterContext] Error uploading photo:', error);
              uploadedPhotos.push(photo); // Keep local URI as fallback
            }
          } else {
            // Already a URL or empty, keep as is
            uploadedPhotos.push(photo);
          }
        }
        
        dbUpdates.photos = uploadedPhotos;
      }
      // Note: lastDate and nextDate would need special handling to convert back to ISO format
      
      // Update the roster entry
      await RosterService.updateRosterEntry(id, dbUpdates);
      
      // Sync changes to any corresponding feed entries
      try {
        await DateService.syncRosterToFeedEntries(user.id, currentEntry.name, dbUpdates);
      } catch (syncError) {
        console.error('Failed to sync roster changes to feed:', syncError);
        // Don't throw here - we still want the roster update to succeed
      }
      
      // Refresh roster after updating
      await loadRoster();
      
      // Also refresh the dates/feed to show updated info
      try {
        await refreshDates();
      } catch (refreshError) {
        console.error('Failed to refresh dates after roster update:', refreshError);
      }
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry');
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Find the entry to get the person's name
      const entry = [...entries].find(e => e.id === id);
      if (!entry) throw new Error('Entry not found');
      
      // Delete all date entries for this person first
      await DateService.deleteDateEntriesForPerson(user.id, entry.name);
      
      // Then delete the roster entry
      await RosterService.deleteRosterEntry(id);
      
      // Refresh roster after deleting
      await loadRoster();
      
      // Also refresh dates in the DateContext
      await refreshDates();
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry');
      throw err;
    }
  };

  const refreshRoster = async () => {
    await loadRoster(true);
  };

  const value = {
    activeRoster,
    pastConnections,
    isLoading,
    error,
    addPerson,
    updateEntry,
    deleteEntry,
    refreshRoster,
    stats,
  };

  return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
}

export function useRoster() {
  const context = useContext(RosterContext);
  if (context === undefined) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
}