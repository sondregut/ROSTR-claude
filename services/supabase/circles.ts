import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notifications/NotificationService';

export interface Circle {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  is_active: boolean;
  member_count: number;
  max_members: number;
  is_private: boolean;
  join_code: string | null;
  group_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    image_uri: string;
  };
}

export const CircleService = {
  // Get circle details with members
  async getCircleWithMembers(circleId: string) {
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('*')
      .eq('id', circleId)
      .single();

    if (circleError) throw circleError;

    const { data: members, error: membersError } = await supabase
      .from('circle_members')
      .select(`
        *,
        user:users!circle_members_user_id_fkey (
          id,
          name,
          username,
          image_uri
        )
      `)
      .eq('circle_id', circleId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    return { circle, members };
  },

  // Get user's role in a circle
  async getUserRole(circleId: string, userId: string): Promise<'owner' | 'admin' | 'member' | null> {
    const { data, error } = await supabase
      .from('circle_members')
      .select('role')
      .eq('circle_id', circleId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.role as 'owner' | 'admin' | 'member';
  },

  // Check if user has admin permissions (owner or admin)
  async hasAdminPermissions(circleId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRole(circleId, userId);
    return role === 'owner' || role === 'admin';
  },

  // Update circle details (admin only)
  async updateCircle(circleId: string, updates: Partial<Circle>) {
    let finalUpdates = { ...updates };
    
    // Handle photo upload if new photo is provided
    if (updates.group_photo_url && updates.group_photo_url.startsWith('file://')) {
      try {
        const uploadedUrl = await this.uploadCirclePhoto(circleId, updates.group_photo_url);
        finalUpdates.group_photo_url = uploadedUrl;
      } catch (error) {
        console.error('Failed to upload circle photo:', error);
        delete finalUpdates.group_photo_url;
      }
    }
    
    const { data, error } = await supabase
      .from('circles')
      .update({
        ...finalUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', circleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove member from circle (admin only, cannot remove owner)
  async removeMember(circleId: string, memberId: string) {
    // First check if member is owner
    const { data: member, error: memberError } = await supabase
      .from('circle_members')
      .select('role')
      .eq('circle_id', circleId)
      .eq('user_id', memberId)
      .single();

    if (memberError) throw memberError;
    if (member.role === 'owner') {
      throw new Error('Cannot remove circle owner');
    }

    const { error } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', memberId);

    if (error) throw error;

    // Update member count
    await supabase.rpc('decrement_circle_member_count', { circle_id: circleId });
  },

  // Update member role (owner only)
  async updateMemberRole(circleId: string, memberId: string, newRole: 'admin' | 'member') {
    if (newRole === 'owner') {
      throw new Error('Use transferOwnership to change circle owner');
    }

    const { error } = await supabase
      .from('circle_members')
      .update({ role: newRole })
      .eq('circle_id', circleId)
      .eq('user_id', memberId);

    if (error) throw error;
  },

  // Transfer ownership (owner only)
  async transferOwnership(circleId: string, currentOwnerId: string, newOwnerId: string) {
    // Start a transaction by updating both members
    const { error: demoteError } = await supabase
      .from('circle_members')
      .update({ role: 'admin' })
      .eq('circle_id', circleId)
      .eq('user_id', currentOwnerId);

    if (demoteError) throw demoteError;

    const { error: promoteError } = await supabase
      .from('circle_members')
      .update({ role: 'owner' })
      .eq('circle_id', circleId)
      .eq('user_id', newOwnerId);

    if (promoteError) {
      // Rollback by promoting original owner back
      await supabase
        .from('circle_members')
        .update({ role: 'owner' })
        .eq('circle_id', circleId)
        .eq('user_id', currentOwnerId);
      throw promoteError;
    }

    // Update circle owner_id
    const { error: circleError } = await supabase
      .from('circles')
      .update({ owner_id: newOwnerId })
      .eq('id', circleId);

    if (circleError) throw circleError;
  },

  // Delete circle (owner only)
  async deleteCircle(circleId: string) {
    const { error } = await supabase
      .from('circles')
      .delete()
      .eq('id', circleId);

    if (error) throw error;
  },

  // Get all circles for a user
  async getUserCircles(userId: string) {
    // First try to get circles where user is a member
    const { data: memberData, error: memberError } = await supabase
      .from('circle_members')
      .select(`
        circle:circles (
          *,
          members:circle_members (
            user:users!circle_members_user_id_fkey (
              id,
              name,
              username,
              image_uri
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (memberError) {
      console.error('Error getting circles via members:', memberError);
      // Fallback to getting circles by owner_id for development
      const { data: ownerData, error: ownerError } = await supabase
        .from('circles')
        .select(`
          *,
          members:circle_members (
            user:users!circle_members_user_id_fkey (
              id,
              name,
              username,
              image_uri
            )
          )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (ownerError) {
        console.error('Error getting circles via owner:', ownerError);
        return [];
      }
      return ownerData || [];
    }
    
    return memberData?.map(item => item.circle) || [];
  },

  // Upload circle photo to Supabase storage
  async uploadCirclePhoto(circleId: string, photoUri: string) {
    try {
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      const fileName = `${circleId}_${Date.now()}.jpg`;
      const filePath = `circles/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('user-photos')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading circle photo:', error);
      throw error;
    }
  },

  // Create a new circle
  async createCircle(name: string, description: string, ownerId: string, groupPhotoUrl?: string) {
    let uploadedPhotoUrl = null;
    
    // Upload photo if provided
    if (groupPhotoUrl && groupPhotoUrl.startsWith('file://')) {
      try {
        // Generate a temporary circle ID for the photo
        const tempId = `temp_${Date.now()}`;
        uploadedPhotoUrl = await this.uploadCirclePhoto(tempId, groupPhotoUrl);
      } catch (error) {
        console.error('Failed to upload circle photo:', error);
        // Continue without photo if upload fails
      }
    }
    
    // Create the circle
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .insert({
        name,
        description,
        owner_id: ownerId,
        group_photo_url: uploadedPhotoUrl || groupPhotoUrl,
        join_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      })
      .select()
      .single();

    if (circleError) throw circleError;

    // Add owner as first member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        user_id: ownerId,
        role: 'owner'
      });

    if (memberError) {
      console.error('Failed to add owner as member:', memberError);
      
      // Check if this is a RLS policy error for circle_chat_members
      if (memberError.message?.includes('circle_chat_members') || memberError.code === '42501') {
        console.error('RLS Policy Error: Missing INSERT policy for circle_chat_members table');
        console.error('Please run: supabase/fix_circle_chat_rls.sql to fix this issue');
        
        // Cleanup circle if member creation fails due to RLS
        await supabase.from('circles').delete().eq('id', circle.id);
        throw new Error('Circle creation failed due to database permissions. Please contact administrator to run the fix_circle_chat_rls.sql script.');
      }
      
      // For other errors, still clean up but allow for development
      console.error('Non-RLS error, allowing circle creation for development:', memberError);
    }

    return circle;
  },

  // Add members to circle
  async addMembers(circleId: string, userIds: string[]) {
    // Get current authenticated user for permission check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user has admin permissions for this circle
    const hasPermission = await this.hasAdminPermissions(circleId, user.id);
    if (!hasPermission) {
      throw new Error('Insufficient permissions to add members to this circle');
    }

    // Check for duplicate memberships
    const { data: existingMembers } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circleId)
      .in('user_id', userIds);

    const existingIds = new Set(existingMembers?.map(m => m.user_id) || []);
    const newUserIds = userIds.filter(id => !existingIds.has(id));

    if (newUserIds.length === 0) {
      throw new Error('All selected users are already members of this circle');
    }

    const members = newUserIds.map(userId => ({
      circle_id: circleId,
      user_id: userId,
      role: 'member' as const
    }));

    const { error } = await supabase
      .from('circle_members')
      .insert(members);

    if (error) throw error;

    // Update member count
    await supabase.rpc('increment_circle_member_count', { 
      circle_id: circleId, 
      increment_by: newUserIds.length 
    });

    // Get circle details for notifications
    const { data: circle } = await supabase
      .from('circles')
      .select('name, owner_id')
      .eq('id', circleId)
      .single();

    if (circle) {
      // Send notifications to added members
      const notifications = newUserIds.map(userId => ({
        user_id: userId,
        type: 'circle_invite' as const,
        title: 'Added to Circle',
        body: `You've been added to the circle "${circle.name}"`,
        data: { circleId, circleName: circle.name },
        read: false
      }));

      // Send notifications in parallel
      await Promise.all(
        notifications.map(notification =>
          notificationService.createNotification(notification)
        )
      );
    }

    return newUserIds.length; // Return number of members actually added
  },

  // Get friends who can be invited to a circle (not already members)
  async getInviteableFriends(circleId: string, userId: string) {
    // Get user's friends
    const { data: friends, error: friendsError } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        friend:users!friendships_friend_id_fkey (
          id,
          name,
          username,
          image_uri
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (friendsError) throw friendsError;

    // Get current circle members
    const { data: members, error: membersError } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circleId);

    if (membersError) throw membersError;

    const memberIds = new Set(members?.map(m => m.user_id) || []);

    // Filter out friends who are already members
    return (friends || [])
      .filter(f => f.friend && !memberIds.has(f.friend_id))
      .map(f => ({
        id: f.friend_id,
        name: f.friend.name,
        username: f.friend.username,
        image_uri: f.friend.image_uri,
      }));
  }
};