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
    console.log('🔍 Getting friends for user:', userId);
    
    try {
      // First try with proper foreign key syntax
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          created_at,
          status,
          friend:users!friend_id (
            id,
            name,
            username,
            instagram_username,
            image_uri,
            bio
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        console.log(`✅ Found ${data.length} friends (as user) for ${userId}`);
        const friendsAsUser = data.map(friendship => ({
          id: friendship.friend?.id || friendship.friend_id,
          name: friendship.friend?.name || 'Unknown',
          username: friendship.friend?.username || 
                   friendship.friend?.instagram_username || 
                   friendship.friend?.name?.toLowerCase().replace(/\s+/g, '') || '',
          image_uri: friendship.friend?.image_uri || '',
          bio: friendship.friend?.bio || '',
          friendshipId: friendship.id,
          friendedAt: friendship.created_at,
        }));
        
        // Also check reverse friendships (where user is the friend_id)
        const { data: reverseFriendships } = await supabase
          .from('friendships')
          .select(`
            id,
            user_id,
            friend_id,
            created_at,
            status,
            user:users!user_id (
              id,
              name,
              username,
              instagram_username,
              image_uri,
              bio
            )
          `)
          .eq('friend_id', userId)
          .eq('status', 'active');
        
        if (reverseFriendships && reverseFriendships.length > 0) {
          console.log(`✅ Found ${reverseFriendships.length} friends (as friend) for ${userId}`);
          const friendsAsFriend = reverseFriendships.map(friendship => ({
            id: friendship.user?.id || friendship.user_id,
            name: friendship.user?.name || 'Unknown',
            username: friendship.user?.username || 
                     friendship.user?.instagram_username || 
                     friendship.user?.name?.toLowerCase().replace(/\s+/g, '') || '',
            image_uri: friendship.user?.image_uri || '',
            bio: friendship.user?.bio || '',
            friendshipId: friendship.id,
            friendedAt: friendship.created_at,
          }));
          
          // Merge both lists and remove duplicates
          const allFriends = [...friendsAsUser, ...friendsAsFriend];
          const uniqueFriends = Array.from(new Map(allFriends.map(f => [f.id, f])).values());
          console.log(`✅ Total unique friends: ${uniqueFriends.length}`);
          return uniqueFriends;
        }
        
        return friendsAsUser;
      }
      
      console.log('❌ Primary query failed or returned no data, error:', error);
    } catch (err) {
      console.error('Error with foreign key join:', err);
    }

    // Fallback: fetch friendships and users separately with bidirectional check
    console.log('Using fallback method to fetch friends');
    
    // Get friendships where user is user_id
    const { data: friendshipsAsUser, error: friendshipsError } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, created_at, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    // Also get friendships where user is friend_id (reverse)
    const { data: friendshipsAsFriend, error: reverseFriendshipsError } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, created_at, status')
      .eq('friend_id', userId)
      .eq('status', 'active');
    
    // Combine both directions
    const allFriendships = [
      ...(friendshipsAsUser || []),
      ...(friendshipsAsFriend || [])
    ];
    
    if (allFriendships.length === 0) {
      console.log('No friendships found in either direction for user:', userId);
      return [];
    }
    
    console.log(`Found ${allFriendships.length} total friendships (both directions) for user ${userId}`);
    
    // Collect all friend IDs (from both directions)
    const friendIds = new Set<string>();
    friendshipsAsUser?.forEach(f => friendIds.add(f.friend_id));
    friendshipsAsFriend?.forEach(f => friendIds.add(f.user_id));
    
    if (friendIds.size === 0) {
      console.log('No friend IDs found');
      return [];
    }
    
    // Fetch user details for all friends
    const { data: friends, error: friendsError } = await supabase
      .from('users')
      .select('id, name, username, instagram_username, image_uri, bio')
      .in('id', Array.from(friendIds));
    
    if (friendsError) {
      console.error('Error fetching friend details:', friendsError);
      throw friendsError;
    }
    
    console.log(`Found ${friends?.length || 0} friend details`);
    console.log('Friend details:', friends?.map(f => ({ id: f.id, name: f.name, username: f.username })));
    
    // Map friends with their friendship data
    const mappedFriends = Array.from(friendIds).map(friendId => {
      const friend = friends?.find(f => f.id === friendId);
      const friendship = allFriendships.find(f => 
        f.friend_id === friendId || f.user_id === friendId
      );
      
      return {
        id: friend?.id || friendId,
        name: friend?.name || 'Unknown',
        username: friend?.username || 
                 friend?.instagram_username || 
                 friend?.name?.toLowerCase().replace(/\s+/g, '') || '',
        image_uri: friend?.image_uri || '',
        bio: friend?.bio || '',
        friendshipId: friendship?.id || '',
        friendedAt: friendship?.created_at || ''
      };
    }).filter(f => f.id); // Filter out any invalid entries
    
    console.log(`Returning ${mappedFriends.length} friends`);
    return mappedFriends;
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

  // Remove a friend (deletes both directions of friendship)
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    // Delete friendship in both directions
    const { error: error1 } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', friendId);

    const { error: error2 } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', friendId)
      .eq('friend_id', userId);

    if (error1 || error2) {
      console.error('Error removing friend:', error1 || error2);
      throw error1 || error2;
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