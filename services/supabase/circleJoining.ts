import { supabase } from '@/lib/supabase';

export interface JoinCircleResult {
  success: boolean;
  error?: string;
  circle?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface CircleInviteInfo {
  circle_id: string;
  circle_name: string;
  circle_description?: string;
  invited_by_name?: string;
  is_valid: boolean;
  is_expired: boolean;
  is_already_member: boolean;
}

/**
 * Get information about a circle invite without joining
 */
export const getCircleInviteInfo = async (
  circleId: string,
  userId: string
): Promise<CircleInviteInfo | null> => {
  try {
    // Get circle information
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('id, name, description, created_at')
      .eq('id', circleId)
      .single();

    if (circleError || !circle) {
      console.error('Error fetching circle:', circleError);
      return null;
    }

    // Check if user is already a member
    const { data: membership, error: membershipError } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', circleId)
      .eq('user_id', userId)
      .single();

    const isAlreadyMember = !membershipError && !!membership;

    // For now, we'll consider invites valid for 30 days
    const createdAt = new Date(circle.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isExpired = createdAt < thirtyDaysAgo;

    return {
      circle_id: circle.id,
      circle_name: circle.name,
      circle_description: circle.description,
      is_valid: true,
      is_expired: isExpired,
      is_already_member: isAlreadyMember,
    };
  } catch (error) {
    console.error('Error getting circle invite info:', error);
    return null;
  }
};

/**
 * Join a circle by invite
 */
export const joinCircleByInvite = async (
  circleId: string,
  userId: string,
  invitedByName?: string
): Promise<JoinCircleResult> => {
  try {
    // First, get invite info to validate
    const inviteInfo = await getCircleInviteInfo(circleId, userId);
    
    if (!inviteInfo) {
      return {
        success: false,
        error: 'Circle not found or invite is invalid'
      };
    }

    if (inviteInfo.is_already_member) {
      return {
        success: false,
        error: 'You are already a member of this circle'
      };
    }

    if (inviteInfo.is_expired) {
      return {
        success: false,
        error: 'This invite has expired'
      };
    }

    // Add user to circle
    const { error: joinError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circleId,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString(),
        invited_by: invitedByName || null
      });

    if (joinError) {
      console.error('Error joining circle:', joinError);
      return {
        success: false,
        error: 'Failed to join circle. Please try again.'
      };
    }

    // Return success with circle info
    return {
      success: true,
      circle: {
        id: inviteInfo.circle_id,
        name: inviteInfo.circle_name,
        description: inviteInfo.circle_description
      }
    };

  } catch (error) {
    console.error('Error in joinCircleByInvite:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
};

/**
 * Get user's circle memberships
 */
export const getUserCircleMemberships = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('circle_members')
      .select(`
        id,
        role,
        joined_at,
        circles (
          id,
          name,
          description,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching user circle memberships:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserCircleMemberships:', error);
    return [];
  }
};

/**
 * Leave a circle
 */
export const leaveCircle = async (
  circleId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error leaving circle:', error);
      return {
        success: false,
        error: 'Failed to leave circle. Please try again.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in leaveCircle:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
};