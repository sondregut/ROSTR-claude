import { supabase } from '@/lib/supabase';

export interface SearchResult {
  id: string;
  name: string;
  username: string;
  image_uri?: string;
  is_friend: boolean;
}

export class UserSearchService {
  /**
   * Search users by username
   */
  static async searchByUsername(query: string, userId: string): Promise<SearchResult[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      // Clean the query (remove @ if present)
      const cleanQuery = query.replace('@', '').trim();

      const { data, error } = await supabase
        .rpc('search_users_by_username', {
          search_query: cleanQuery,
          requesting_user_id: userId
        });

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data?.map((user: any) => ({
        id: user.user_id,
        name: user.user_name,
        username: user.username,
        image_uri: user.image_uri,
        is_friend: user.is_friend
      })) || [];
    } catch (error) {
      console.error('Error in searchByUsername:', error);
      return [];
    }
  }

  /**
   * Send a friend request (creates pending friendship)
   */
  static async sendFriendRequest(friendId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return false;
      }

      // Check if any relationship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('status')
        .eq('user_id', user.id)
        .eq('friend_id', friendId)
        .single();

      if (existing) {
        if (existing.status === 'active') {
          return true; // Already friends
        } else if (existing.status === 'pending') {
          return true; // Request already sent
        }
      }

      // Create pending friend request - RLS will validate user_id matches auth.uid()
      const { error } = await supabase
        .from('friendships')
        .upsert({
          user_id: user.id, // This must match auth.uid() for RLS
          friend_id: friendId,
          status: 'pending',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,friend_id'
        });

      if (error) {
        console.error('RLS Error sending friend request:', error);
        return false;
      }

      // Get sender details for notification
      const { data: senderDetails } = await supabase
        .from('users')
        .select('name, username')
        .eq('id', user.id)
        .single();

      if (senderDetails) {
        // Send notification to the recipient
        await notificationService.createNotification({
          user_id: friendId,
          type: 'friend_request',
          title: 'Friend Request',
          body: `${senderDetails.name} wants to be your friend`,
          data: { 
            senderId: user.id, 
            senderName: senderDetails.name,
            senderUsername: senderDetails.username 
          },
          read: false
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  }

  /**
   * @deprecated Use sendFriendRequest instead
   */
  static async addFriend(friendId: string): Promise<boolean> {
    return this.sendFriendRequest(friendId);
  }

  /**
   * Remove a friend
   */
  static async removeFriend(friendId: string): Promise<boolean> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return false;
      }

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);

      if (error) {
        console.error('RLS Error removing friend:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  }

  /**
   * Get user profile by username for deep links
   */
  static async getUserByUsername(username: string): Promise<SearchResult | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, image_uri')
        .eq('username', username)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        username: data.username,
        image_uri: data.image_uri,
        is_friend: false // We'll check this separately if needed
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  /**
   * Check if two users are friends
   */
  static async checkFriendship(userId: string, friendId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('are_friends', {
          p_user_id: userId,
          p_other_user_id: friendId
        });

      return !error && data === true;
    } catch (error) {
      console.error('Error checking friendship:', error);
      return false;
    }
  }
}