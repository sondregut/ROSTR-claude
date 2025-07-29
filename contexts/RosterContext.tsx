import React, { createContext, useContext, useState, useEffect } from 'react';
import { RosterService, RosterEntry as DbRosterEntry } from '@/services/supabase/roster';
import { useAuth } from '@/contexts/SimpleAuthContext';

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
    photos: dbEntry.photos,
  };
};

export function RosterProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
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
  const loadRoster = async () => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
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
        
      await RosterService.addRosterEntry(user.id, entry);
      // Refresh roster after adding
      await loadRoster();
    } catch (err) {
      console.error('Error adding person:', err);
      setError('Failed to add person');
      throw err;
    }
  };

  const updateEntry = async (id: string, updates: Partial<RosterEntry>) => {
    try {
      // Transform UI updates to database format
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
      // Note: lastDate and nextDate would need special handling to convert back to ISO format
      
      await RosterService.updateRosterEntry(id, dbUpdates);
      // Refresh roster after updating
      await loadRoster();
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry');
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await RosterService.deleteRosterEntry(id);
      // Refresh roster after deleting
      await loadRoster();
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry');
      throw err;
    }
  };

  const refreshRoster = async () => {
    await loadRoster();
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