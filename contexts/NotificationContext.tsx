import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { notificationService, Notification, NotificationPreferences } from '@/services/notifications/NotificationService';
import { pushNotificationService } from '@/services/notifications/PushNotificationService';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Check if we're in Expo Go (simulators with dev builds can handle push notifications)
const isExpoGo = Constants.appOwnership === 'expo' || !Constants.appOwnership;

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Push notification status
  pushEnabled: boolean;
  requestPushPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const auth = useSafeAuth();
  const user = auth?.user;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Load notifications and preferences
  const loadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load notifications, count, and preferences in parallel
      const [notifs, count, prefs] = await Promise.all([
        notificationService.getNotifications(user.id),
        notificationService.getUnreadCount(user.id),
        notificationService.getPreferences(user.id),
      ]);
      
      setNotifications(notifs);
      setUnreadCount(count);
      setPreferences(prefs);
      
      // Update badge count
      if (pushEnabled) {
        await pushNotificationService.setBadgeCount(count);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription
  const setupRealtimeSubscription = () => {
    if (!user) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to notifications for this user
    channelRef.current = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New notification:', payload);
          
          // Add new notification to the list
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Update badge count
          if (pushEnabled) {
            const newCount = unreadCount + 1;
            await pushNotificationService.setBadgeCount(newCount);
          }
          
          // Show in-app notification if app is in foreground
          if (appStateRef.current === 'active') {
            // TODO: Show in-app toast notification
            console.log('Show in-app notification:', newNotification);
          }
        }
      )
      .subscribe();
  };

  // Initialize push notifications
  const initializePushNotifications = async () => {
    if (!user) return;

    // Skip push notification initialization only in Expo Go
    if (isExpoGo) {
      console.log('Push notifications are not available in Expo Go');
      setPushEnabled(false);
      return;
    }

    try {
      await pushNotificationService.initialize(user.id);
      const enabled = await pushNotificationService.areNotificationsEnabled();
      setPushEnabled(enabled);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setPushEnabled(false);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        loadNotifications();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Initialize on user change
  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealtimeSubscription();
      initializePushNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      setPushEnabled(false);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      pushNotificationService.cleanup();
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update badge count
      if (pushEnabled) {
        await pushNotificationService.setBadgeCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await notificationService.markAllAsRead(user.id);
      
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
      
      // Update badge count
      if (pushEnabled) {
        await pushNotificationService.setBadgeCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const notif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notif && !notif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Update badge count
        if (pushEnabled) {
          await pushNotificationService.setBadgeCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  // Update preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    try {
      await notificationService.updatePreferences(user.id, newPreferences);
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    await loadNotifications();
  };

  // Request push permissions
  const requestPushPermissions = async (): Promise<boolean> => {
    try {
      const status = await pushNotificationService.requestPermissions();
      const enabled = status === 'granted';
      setPushEnabled(enabled);
      
      if (enabled && user) {
        // Re-initialize to save token
        await pushNotificationService.initialize(user.id);
      }
      
      return enabled;
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      return false;
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refreshNotifications,
    pushEnabled,
    requestPushPermissions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}