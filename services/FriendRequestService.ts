import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notifications/NotificationService';

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'active' | 'blocked';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    image_uri: string;
  };
}

export class FriendRequestService {
  /**
   * Send a friend request
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

      // Create pending friend request (handle duplicates)
      const { error } = await supabase
        .from('friendships')
        .upsert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,friend_id'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        return false;
      }

      // Get sender details for notification
      const { data: senderDetails } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      if (senderDetails) {
        // Send notification to the recipient
        await notificationService.createNotification({
          user_id: friendId,
          type: 'friend_request',
          title: 'Friend Request',
          body: `${senderDetails.name} wants to be your friend`,
          data: { senderId: user.id, senderName: senderDetails.name },
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
   * Accept a friend request
   */
  static async acceptFriendRequest(requesterId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }

      console.log('Accepting friend request from:', requesterId, 'to:', user.id);

      // Use the database function to accept the friend request
      const { data, error } = await supabase
        .rpc('accept_friend_request', {
          p_requester_id: requesterId,
          p_accepter_id: user.id
        });

      if (error) {
        console.error('Error calling accept_friend_request function:', error);
        throw new Error(`Failed to accept friend request: ${error.message}`);
      }

      if (!data) {
        console.error('accept_friend_request returned false');
        throw new Error('Friend request acceptance failed');
      }

      console.log('Friend request accepted successfully');

      // Get user details for notification
      const { data: userDetails } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      if (userDetails) {
        // Send acceptance notification to the original requester
        await notificationService.createNotification({
          user_id: requesterId,
          type: 'friend_request_accepted',
          title: 'Friend Request Accepted',
          body: `${userDetails.name} accepted your friend request`,
          data: { accepterId: user.id, accepterName: userDetails.name },
          read: false
        });
      }

      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  }

  /**
   * Reject/ignore a friend request
   */
  static async rejectFriendRequest(requesterId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return false;
      }

      // Delete the friend request
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error rejecting friend request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    }
  }

  /**
   * Get pending friend requests for current user
   */
  static async getPendingRequests(): Promise<FriendRequest[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return [];
      }

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          user:users!friendships_user_id_fkey (
            id,
            name,
            username,
            image_uri
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting pending requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }
  }

  /**
   * Get sent friend requests (pending outgoing requests)
   */
  static async getSentRequests(): Promise<FriendRequest[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return [];
      }

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          user:users!friendships_friend_id_fkey (
            id,
            name,
            username,
            image_uri
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting sent requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting sent requests:', error);
      return [];
    }
  }

  /**
   * Check friendship status between two users
   */
  static async getFriendshipStatus(otherUserId: string): Promise<'friends' | 'pending_sent' | 'pending_received' | 'none'> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return 'none';
      }

      // Check for active friendship (mutual)
      const { data: activeFriendship } = await supabase
        .from('friendships')
        .select('status')
        .eq('user_id', user.id)
        .eq('friend_id', otherUserId)
        .eq('status', 'active')
        .single();

      if (activeFriendship) {
        return 'friends';
      }

      // Check for pending request sent by current user
      const { data: sentRequest } = await supabase
        .from('friendships')
        .select('status')
        .eq('user_id', user.id)
        .eq('friend_id', otherUserId)
        .eq('status', 'pending')
        .single();

      if (sentRequest) {
        return 'pending_sent';
      }

      // Check for pending request received by current user
      const { data: receivedRequest } = await supabase
        .from('friendships')
        .select('status')
        .eq('user_id', otherUserId)
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .single();

      if (receivedRequest) {
        return 'pending_received';
      }

      return 'none';
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return 'none';
    }
  }

  /**
   * Cancel a sent friend request
   */
  static async cancelFriendRequest(friendId: string): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return false;
      }

      const { data, error } = await supabase
        .rpc('reject_friend_request', {
          p_requester_id: user.id,
          p_target_id: friendId
        });

      if (error) {
        console.error('Error canceling friend request:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error canceling friend request:', error);
      return false;
    }
  }
}