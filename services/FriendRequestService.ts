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

      console.log('Friend request accepted successfully, verifying...');
      
      // Wait for database to propagate the changes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify the friendship was created successfully
      const verifiedStatus = await this.getFriendshipStatusWithRetry(requesterId, 5);
      
      if (verifiedStatus !== 'friends') {
        console.error('Friendship verification failed, status:', verifiedStatus);
        // Try one more time with a longer delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const finalStatus = await this.getFriendshipStatus(requesterId);
        if (finalStatus !== 'friends') {
          console.error('Final verification failed, friendship may not be properly established');
        }
      }

      // Get user details for notification
      const { data: userDetails } = await supabase
        .from('users')
        .select('name, username')
        .eq('id', user.id)
        .single();

      if (userDetails) {
        // Send acceptance notification to the original requester
        await notificationService.createNotification({
          user_id: requesterId,
          type: 'friend_request_accepted',
          title: 'Friend Request Accepted',
          body: `${userDetails.name} accepted your friend request`,
          data: { 
            accepterId: user.id, 
            accepterName: userDetails.name,
            accepterUsername: userDetails.username 
          },
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

      console.log('Rejecting friend request from:', requesterId, 'to:', user.id);

      // Use the database function to reject the friend request
      const { data, error } = await supabase
        .rpc('reject_friend_request', {
          p_requester_id: requesterId,
          p_target_id: user.id
        });

      if (error) {
        console.error('Error calling reject_friend_request function:', error);
        return false;
      }

      console.log('Friend request rejected, result:', data);
      return data === true;
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
  static async getFriendshipStatus(otherUserId: string, retryAttempts = 0): Promise<'friends' | 'pending_sent' | 'pending_received' | 'none'> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return 'none';
      }

      // Check for active friendship in BOTH directions
      const { data: activeFriendship1 } = await supabase
        .from('friendships')
        .select('status')
        .eq('user_id', user.id)
        .eq('friend_id', otherUserId)
        .eq('status', 'active')
        .single();

      const { data: activeFriendship2 } = await supabase
        .from('friendships')
        .select('status')
        .eq('user_id', otherUserId)
        .eq('friend_id', user.id)
        .eq('status', 'active')
        .single();

      // Both directions must be active for true friendship
      if (activeFriendship1 && activeFriendship2) {
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
   * Check friendship status with retry logic for after acceptance
   */
  static async getFriendshipStatusWithRetry(otherUserId: string, maxRetries = 3): Promise<'friends' | 'pending_sent' | 'pending_received' | 'none'> {
    console.log(`Checking friendship status with retry for user: ${otherUserId}`);
    
    for (let i = 0; i < maxRetries; i++) {
      const status = await this.getFriendshipStatus(otherUserId);
      console.log(`Attempt ${i + 1}/${maxRetries}: Status = ${status}`);
      
      if (status === 'friends' || i === maxRetries - 1) {
        return status;
      }
      
      // Wait before retrying (exponential backoff with longer initial delay)
      const delay = Math.pow(2, i) * 1000; // Start with 1 second, then 2, 4, etc.
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return await this.getFriendshipStatus(otherUserId);
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