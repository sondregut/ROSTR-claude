import { useState, useEffect } from 'react';
import { CircleService } from '@/services/supabase/circles';
import { useAuth } from '@/contexts/AuthContext';

interface CirclePermissions {
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  canEditCircle: boolean;
  canRemoveMembers: boolean;
  canPromoteMembers: boolean;
  canDeleteCircle: boolean;
  isLoading: boolean;
  role: 'owner' | 'admin' | 'member' | null;
}

export function useCirclePermissions(circleId: string): CirclePermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<CirclePermissions>({
    isOwner: false,
    isAdmin: false,
    isMember: false,
    canEditCircle: false,
    canRemoveMembers: false,
    canPromoteMembers: false,
    canDeleteCircle: false,
    isLoading: true,
    role: null,
  });

  useEffect(() => {
    if (!user || !circleId) {
      setPermissions(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const checkPermissions = async () => {
      try {
        const role = await CircleService.getUserRole(circleId, user.id);
        
        setPermissions({
          isOwner: role === 'owner',
          isAdmin: role === 'admin',
          isMember: role === 'member',
          canEditCircle: role === 'owner' || role === 'admin',
          canRemoveMembers: role === 'owner' || role === 'admin',
          canPromoteMembers: role === 'owner',
          canDeleteCircle: role === 'owner',
          isLoading: false,
          role,
        });
      } catch (error) {
        console.error('Failed to check circle permissions:', error);
        setPermissions(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkPermissions();
  }, [circleId, user]);

  return permissions;
}