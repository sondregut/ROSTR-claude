import { supabase } from '@/lib/supabase';

export type NotificationType = 
  | 'like'
  | 'reaction'
  | 'comment'
  | 'mention'
  | 'poll_vote'
  | 'friend_date'
  | 'friend_roster'
  | 'friend_plan'
  | 'friend_request'
  | 'friend_request_accepted'
  | 'circle_invite'
  | 'circle_activity'
  | 'message'
  | 'circle_message'
  | 'reminder'
  | 'achievement'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  likes_reactions: boolean;
  comments: boolean;
  mentions: boolean;
  friend_activity: boolean;
  circle_updates: boolean;
  reminders: boolean;
  achievements: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_id?: string;
  app_version?: string;
  os_version?: string;
  active: boolean;
  last_used: string;
  created_at: string;
  updated_at: string;
}

class NotificationService {
  // Get user's notifications
  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get notification preferences
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching preferences:', error);
      throw error;
    }

    return data;
  }

  // Update notification preferences
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Save push token
  async savePushToken(
    userId: string, 
    token: string, 
    platform: 'ios' | 'android' | 'web',
    deviceInfo?: {
      device_id?: string;
      app_version?: string;
      os_version?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token,
        platform,
        ...deviceInfo,
        active: true,
        last_used: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'token'
      });

    if (error) {
      console.error('Error saving push token:', error);
      throw error;
    }
  }

  // Remove push token
  async removePushToken(token: string): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Error removing push token:', error);
      throw error;
    }
  }

  // Deactivate push token
  async deactivatePushToken(token: string): Promise<void> {
    const { error } = await supabase
      .from('push_tokens')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('token', token);

    if (error) {
      console.error('Error deactivating push token:', error);
      throw error;
    }
  }

  // Create a notification (usually called from backend)
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Check if should send notification based on preferences and quiet hours
  shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    // Check if push notifications are enabled
    if (!preferences.push_enabled) return false;

    // Check specific notification type preferences
    switch (type) {
      case 'like':
      case 'reaction':
        return preferences.likes_reactions;
      case 'comment':
      case 'mention':
        return preferences.comments;
      case 'message':
      case 'circle_message':
        return preferences.comments; // Use comments preference for messages
      case 'friend_date':
      case 'friend_roster':
      case 'friend_plan':
        return preferences.friend_activity;
      case 'circle_invite':
      case 'circle_activity':
        return preferences.circle_updates;
      case 'reminder':
        return preferences.reminders;
      case 'achievement':
        return preferences.achievements;
      default:
        return true;
    }
  }

  // Check if currently in quiet hours
  isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_enabled || !preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle cases where quiet hours span midnight
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }
}

export const notificationService = new NotificationService();