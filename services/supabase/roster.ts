import { supabase } from '@/lib/supabase';

export interface RosterEntry {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'new' | 'fading' | 'ended' | 'ghosted';
  rating: number;
  last_date?: string;
  next_date?: string;
  age?: number;
  occupation?: string;
  location?: string;
  how_we_met?: string;
  interests?: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export class RosterService {
  /**
   * Get all roster entries for a user
   */
  static async getRosterEntries(userId: string): Promise<RosterEntry[]> {
    try {
      const { data, error } = await supabase
        .from('roster_entries')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching roster entries:', error);
      throw error;
    }
  }

  /**
   * Add a new roster entry
   */
  static async addRosterEntry(
    userId: string,
    entry: {
      name: string;
      age?: string;
      occupation?: string;
      location?: string;
      howWeMet?: string;
      interests?: string;
      phone?: string;
      instagram?: string;
      notes?: string;
      photos?: string[];
    }
  ): Promise<RosterEntry> {
    try {
      console.log('[RosterService] Adding roster entry with photos:', entry.photos);
      
      const { data, error } = await supabase
        .from('roster_entries')
        .insert({
          user_id: userId,
          name: entry.name,
          status: 'new',
          rating: null,
          last_date: null,
          next_date: null,
          age: entry.age && entry.age.trim() !== '' ? parseInt(entry.age) : null,
          occupation: entry.occupation || null,
          location: entry.location || null,
          how_we_met: entry.howWeMet || null,
          interests: entry.interests || null,
          phone: entry.phone || null,
          instagram: entry.instagram || null,
          notes: entry.notes || null,
          photos: entry.photos || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding roster entry:', error);
      throw error;
    }
  }

  /**
   * Update a roster entry
   */
  static async updateRosterEntry(
    entryId: string,
    updates: Partial<Omit<RosterEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<RosterEntry> {
    try {
      console.log('[RosterService] Updating roster entry:', {
        entryId,
        photos: updates.photos,
      });
      
      const { data, error } = await supabase
        .from('roster_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating roster entry:', error);
      throw error;
    }
  }

  /**
   * Delete a roster entry
   */
  static async deleteRosterEntry(entryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('roster_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting roster entry:', error);
      throw error;
    }
  }

  /**
   * Get roster statistics for a user
   */
  static async getRosterStats(userId: string): Promise<{
    totalEntries: number;
    activeCount: number;
    averageRating: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('roster_entries')
        .select('status, rating')
        .eq('user_id', userId);

      if (error) throw error;

      const entries = data || [];
      const activeEntries = entries.filter(e => e.status === 'active' || e.status === 'new');
      const ratingsSum = entries.reduce((sum, e) => sum + (e.rating || 0), 0);

      return {
        totalEntries: entries.length,
        activeCount: activeEntries.length,
        averageRating: entries.length > 0 ? ratingsSum / entries.length : 0,
      };
    } catch (error) {
      console.error('Error fetching roster stats:', error);
      throw error;
    }
  }

  /**
   * Get a specific person's roster entry from a friend's roster by username
   */
  static async getFriendRosterEntry(friendUsername: string, personName: string): Promise<RosterEntry | null> {
    try {
      // First try to get friend by username with multiple fallback methods
      let userData = null;
      
      // Try exact username match
      const { data: userByUsername } = await supabase
        .from('users')
        .select('id, name, username, instagram_username')
        .eq('username', friendUsername)
        .maybeSingle();

      if (userByUsername) {
        userData = userByUsername;
        console.log('Found friend by username:', friendUsername);
      } else {
        // Try instagram_username
        const { data: userByInstagram } = await supabase
          .from('users')
          .select('id, name, username, instagram_username')
          .eq('instagram_username', friendUsername)
          .maybeSingle();
        
        if (userByInstagram) {
          userData = userByInstagram;
          console.log('Found friend by instagram_username:', friendUsername);
        } else {
          // Try normalized name match as last resort
          const { data: users } = await supabase
            .from('users')
            .select('id, name, username, instagram_username');
          
          if (users && users.length > 0) {
            const normalizedUsername = friendUsername.toLowerCase().replace(/\s+/g, '');
            userData = users.find(user => {
              const normalizedName = user.name?.toLowerCase().replace(/\s+/g, '');
              return normalizedName === normalizedUsername;
            });
            
            if (userData) {
              console.log('Found friend by normalized name:', friendUsername, '->', userData.name);
            }
          }
        }
      }

      if (!userData) {
        console.error('Could not find friend user for username:', friendUsername);
        return null;
      }

      // Then get the roster entry for this person
      const { data, error } = await supabase
        .from('roster_entries')
        .select('*')
        .eq('user_id', userData.id)
        .ilike('name', personName)
        .maybeSingle();

      if (error) {
        console.error('Error fetching friend roster entry:', error);
        return null;
      }

      if (!data) {
        console.log(`Person "${personName}" not found in ${userData.name}'s roster`);
      }

      return data;
    } catch (error) {
      console.error('Error in getFriendRosterEntry:', error);
      return null;
    }
  }
}