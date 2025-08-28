import { supabase } from '@/lib/supabase';

export interface Friend {
  id: string;
  name: string;
  username: string;
  image_uri: string;
  bio?: string;
  friendshipId: string;
  friendedAt: string;
}

export interface FriendshipStatus {
  areFriends: boolean;
  friendshipId?: string;
  status?: 'active' | 'blocked' | 'pending';
}

export class FriendsService {
  // Get user's friends list
  static async getUserFriends(userId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        friend_id,
        created_at,
        friend:users!friendships_friend_id_fkey (
          id,
          name,
          username,
          image_uri,
          bio
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching friends:', error);
      throw error;
    }

    return (data || []).map(friendship => ({
      id: friendship.friend.id,
      name: friendship.friend.name,
      username: friendship.friend.username,
      image_uri: friendship.friend.image_uri,
      bio: friendship.friend.bio,
      friendshipId: friendship.id,
      friendedAt: friendship.created_at,
    }));
  }

  // Send a friend request (creates pending friendship)
  static async addFriend(userId: string, friendId: string): Promise<void> {
    // Check if friendship already exists
    const existingFriendship = await this.getFriendshipStatus(userId, friendId);
    if (existingFriendship.areFriends) {
      throw new Error('Users are already friends');
    }

    // Create pending friend request instead of immediate active friendship
    const { error } = await supabase
      .from('friendships')
      .upsert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,friend_id'
      });

    if (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  // Remove a friend
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', friendId);

    if (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  // Get friendship status between two users
  static async getFriendshipStatus(userId: string, otherUserId: string): Promise<FriendshipStatus> {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, status')
      .eq('user_id', userId)
      .eq('friend_id', otherUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking friendship status:', error);
      throw error;
    }

    if (!data) {
      return { areFriends: false };
    }

    return {
      areFriends: data.status === 'active',
      friendshipId: data.id,
      status: data.status as 'active' | 'blocked' | 'pending'
    };
  }

  // Block a user
  static async blockUser(userId: string, userToBlockId: string): Promise<void> {
    // First remove any existing friendship
    await this.removeFriend(userId, userToBlockId);

    // Create a blocked relationship
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: userToBlockId,
        status: 'blocked'
      });

    if (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  // Unblock a user
  static async unblockUser(userId: string, userToUnblockId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', userToUnblockId)
      .eq('status', 'blocked');

    if (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  // Get mutual friends between two users
  static async getMutualFriends(userId: string, otherUserId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .rpc('get_mutual_friends', {
        p_user_id: userId,
        p_other_user_id: otherUserId
      });

    if (error) {
      console.error('Error fetching mutual friends:', error);
      throw error;
    }

    return (data || []).map((friend: any) => ({
      id: friend.friend_id,
      name: friend.friend_name,
      username: friend.friend_username,
      image_uri: friend.friend_image,
      friendshipId: '',
      friendedAt: ''
    }));
  }

  // Search for potential friends (users not already friends with)
  static async searchPotentialFriends(
    userId: string, 
    query: string, 
    limit: number = 20
  ): Promise<Array<{
    id: string;
    name: string;
    username: string;
    image_uri: string;
    bio?: string;
  }>> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, username, image_uri, bio')
      .neq('id', userId)
      .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      throw error;
    }

    // Filter out existing friends
    const friends = await this.getUserFriends(userId);
    const friendIds = new Set(friends.map(f => f.id));
    
    return (data || []).filter(user => !friendIds.has(user.id));
  }
}

export const friendsService = new FriendsService();