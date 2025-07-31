import React, { createContext, useContext, useState, useEffect } from 'react';
import { CircleService, Circle, CircleMember } from '@/services/supabase/circles';
import { useSafeAuth } from '@/hooks/useSafeAuth';

interface CircleWithDetails extends Circle {
  members: CircleMember[];
  recentUpdates: any[]; // TODO: Define proper type when integrating with dates
}

interface CircleContextType {
  circles: Circle[];
  currentCircle: CircleWithDetails | null;
  isLoading: boolean;
  error: string | null;
  loadCircle: (circleId: string) => Promise<void>;
  refreshCircles: () => Promise<void>;
  createCircle: (data: { name: string; description: string; isPrivate: boolean; groupPhotoUrl?: string }) => Promise<Circle>;
  updateCircle: (circleId: string, updates: Partial<Circle>) => Promise<void>;
  deleteCircle: (circleId: string) => Promise<void>;
  addMember: (circleId: string, email: string) => Promise<void>;
  removeMember: (circleId: string, userId: string) => Promise<void>;
  updateMemberRole: (circleId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
}

const CircleContext = createContext<CircleContextType | undefined>(undefined);

export function CircleProvider({ children }: { children: React.ReactNode }) {
  const auth = useSafeAuth();
  const user = auth?.user;
  const [circles, setCircles] = useState<Circle[]>([]);
  const [currentCircle, setCurrentCircle] = useState<CircleWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's circles
  const loadCircles = async (isRefresh = false) => {
    if (!user) {
      setCircles([]);
      setIsLoading(false);
      return;
    }

    try {
      // Only show loading state if not refreshing or if there's no existing data
      if (!isRefresh || circles.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      
      const userCircles = await CircleService.getUserCircles(user.id);
      setCircles(userCircles);
    } catch (err) {
      console.error('Error loading circles:', err);
      setError('Failed to load circles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCircles();
  }, [user]);

  const loadCircle = async (circleId: string) => {
    try {
      setError(null);
      
      const { circle, members } = await CircleService.getCircleWithMembers(circleId);
      
      // TODO: Load recent updates from date entries
      const circleWithDetails: CircleWithDetails = {
        ...circle,
        members,
        recentUpdates: [],
      };
      
      setCurrentCircle(circleWithDetails);
    } catch (err) {
      console.error('Error loading circle:', err);
      setError('Failed to load circle details');
      throw err;
    }
  };

  const createCircle = async (data: { name: string; description: string; isPrivate: boolean; groupPhotoUrl?: string }) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const newCircle = await CircleService.createCircle(
        data.name,
        data.description,
        user.id,
        data.groupPhotoUrl
      );
      
      // Refresh circles list
      await loadCircles();
      
      return newCircle;
    } catch (err) {
      console.error('Error creating circle:', err);
      setError('Failed to create circle');
      throw err;
    }
  };

  const updateCircle = async (circleId: string, updates: Partial<Circle>) => {
    try {
      await CircleService.updateCircle(circleId, updates);
      
      // Refresh circles and current circle if needed
      await loadCircles();
      if (currentCircle?.id === circleId) {
        await loadCircle(circleId);
      }
    } catch (err) {
      console.error('Error updating circle:', err);
      setError('Failed to update circle');
      throw err;
    }
  };

  const deleteCircle = async (circleId: string) => {
    try {
      await CircleService.deleteCircle(circleId);
      
      // Clear current circle if it was deleted
      if (currentCircle?.id === circleId) {
        setCurrentCircle(null);
      }
      
      // Refresh circles list
      await loadCircles();
    } catch (err) {
      console.error('Error deleting circle:', err);
      setError('Failed to delete circle');
      throw err;
    }
  };

  const addMember = async (circleId: string, email: string) => {
    try {
      await CircleService.addMemberByEmail(circleId, email);
      
      // Refresh current circle
      if (currentCircle?.id === circleId) {
        await loadCircle(circleId);
      }
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member');
      throw err;
    }
  };

  const removeMember = async (circleId: string, userId: string) => {
    try {
      await CircleService.removeMember(circleId, userId);
      
      // Refresh current circle
      if (currentCircle?.id === circleId) {
        await loadCircle(circleId);
      }
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
      throw err;
    }
  };

  const updateMemberRole = async (circleId: string, userId: string, role: 'admin' | 'member') => {
    try {
      await CircleService.updateMemberRole(circleId, userId, role);
      
      // Refresh current circle
      if (currentCircle?.id === circleId) {
        await loadCircle(circleId);
      }
    } catch (err) {
      console.error('Error updating member role:', err);
      setError('Failed to update member role');
      throw err;
    }
  };

  const refreshCircles = async () => {
    await loadCircles(true);
  };

  const value = {
    circles,
    currentCircle,
    isLoading,
    error,
    loadCircle,
    refreshCircles,
    createCircle,
    updateCircle,
    deleteCircle,
    addMember,
    removeMember,
    updateMemberRole,
  };

  return <CircleContext.Provider value={value}>{children}</CircleContext.Provider>;
}

export function useCircles() {
  const context = useContext(CircleContext);
  if (context === undefined) {
    throw new Error('useCircles must be used within a CircleProvider');
  }
  return context;
}