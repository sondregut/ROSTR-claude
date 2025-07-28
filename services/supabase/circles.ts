import { supabase } from '@/lib/supabase';

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
        user:users (
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
    const { data, error } = await supabase
      .from('circles')
      .update({
        ...updates,
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
    const { data, error } = await supabase
      .from('circle_members')
      .select(`
        circle:circles (
          *,
          members:circle_members (
            user:users (
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

    if (error) throw error;
    return data?.map(item => item.circle) || [];
  },

  // Create a new circle
  async createCircle(name: string, description: string, ownerId: string) {
    // Create the circle
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .insert({
        name,
        description,
        owner_id: ownerId,
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
      // Cleanup circle if member creation fails
      await supabase.from('circles').delete().eq('id', circle.id);
      throw memberError;
    }

    return circle;
  },

  // Add members to circle
  async addMembers(circleId: string, userIds: string[]) {
    const members = userIds.map(userId => ({
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
      increment_by: userIds.length 
    });
  }
};