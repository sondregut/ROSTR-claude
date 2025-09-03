import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';
import type { NotificationType, Notification } from './NotificationService';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  senderId?: string;
}

class NotificationHelper {
  /**
   * Create a notification for a like on a date entry
   */
  async createLikeNotification(
    dateOwnerId: string,
    likerId: string,
    likerName: string,
    dateId: string,
    personName: string
  ): Promise<void> {
    // Don't notify if user liked their own date
    if (dateOwnerId === likerId) return;

    try {
      // Check user preferences
      const preferences = await notificationService.getPreferences(dateOwnerId);
      
      if (!preferences || !preferences.push_enabled || !preferences.likes_reactions) {
        console.log('User has disabled like notifications');
        return;
      }

      await this.createNotification({
        userId: dateOwnerId,
        type: 'like',
        title: 'New Like',
        body: `${likerName} liked your date with ${personName}`,
        data: {
          dateId,
          likerId,
          likerName,
          personName,
        },
        senderId: likerId,
      });
    } catch (error) {
      console.error('Error creating like notification:', error);
    }
  }

  /**
   * Create a notification for a comment on a date entry
   */
  async createCommentNotification(
    dateOwnerId: string,
    commenterId: string,
    commenterName: string,
    dateId: string,
    personName: string,
    commentContent: string,
    commentId?: string
  ): Promise<void> {
    // Don't notify if user commented on their own date
    if (dateOwnerId === commenterId) return;

    try {
      // Check user preferences
      const preferences = await notificationService.getPreferences(dateOwnerId);
      
      if (!preferences || !preferences.push_enabled || !preferences.comments) {
        console.log('User has disabled comment notifications');
        return;
      }

      // Truncate comment for preview
      const commentPreview = commentContent.length > 50 
        ? commentContent.substring(0, 47) + '...' 
        : commentContent;

      await this.createNotification({
        userId: dateOwnerId,
        type: 'comment',
        title: 'New Comment',
        body: `${commenterName} commented on your date with ${personName}: "${commentPreview}"`,
        data: {
          dateId,
          commentId,
          commenterId,
          commenterName,
          personName,
          comment: commentContent,
        },
        senderId: commenterId,
      });
    } catch (error) {
      console.error('Error creating comment notification:', error);
    }
  }

  /**
   * Create a notification for friend activity
   */
  async createFriendActivityNotification(
    userId: string,
    friendId: string,
    friendName: string,
    activityType: 'friend_date' | 'friend_roster' | 'friend_plan',
    details: {
      personName?: string;
      location?: string;
      date?: string;
    }
  ): Promise<void> {
    try {
      // Check user preferences
      const preferences = await notificationService.getPreferences(userId);
      
      if (!preferences || !preferences.push_enabled || !preferences.friend_activity) {
        console.log('User has disabled friend activity notifications');
        return;
      }

      let title = '';
      let body = '';
      
      switch (activityType) {
        case 'friend_date':
          title = 'Friend Date Update';
          body = `${friendName} went on a date with ${details.personName || 'someone'}`;
          break;
        case 'friend_roster':
          title = 'Friend Roster Update';
          body = `${friendName} added ${details.personName || 'someone new'} to their roster`;
          break;
        case 'friend_plan':
          title = 'Friend Date Plan';
          body = `${friendName} planned a date with ${details.personName || 'someone'}`;
          break;
      }

      await this.createNotification({
        userId,
        type: activityType,
        title,
        body,
        data: {
          friendId,
          friendName,
          friendUsername: friendName.toLowerCase().replace(/\s+/g, ''),
          ...details,
        },
        senderId: friendId,
      });
    } catch (error) {
      console.error('Error creating friend activity notification:', error);
    }
  }

  /**
   * Create a notification for circle activity
   */
  async createCircleNotification(
    userId: string,
    circleId: string,
    circleName: string,
    activityType: 'circle_invite' | 'circle_activity' | 'circle_message',
    details: {
      inviterId?: string;
      inviterName?: string;
      message?: string;
    }
  ): Promise<void> {
    try {
      // Check user preferences
      const preferences = await notificationService.getPreferences(userId);
      
      if (!preferences || !preferences.push_enabled || !preferences.circle_updates) {
        console.log('User has disabled circle notifications');
        return;
      }

      let title = '';
      let body = '';
      
      switch (activityType) {
        case 'circle_invite':
          title = 'Circle Invitation';
          body = `${details.inviterName || 'Someone'} invited you to join ${circleName}`;
          break;
        case 'circle_activity':
          title = `Activity in ${circleName}`;
          body = details.message || 'New activity in your circle';
          break;
        case 'circle_message':
          title = `New message in ${circleName}`;
          body = details.message || 'You have a new message';
          break;
      }

      await this.createNotification({
        userId,
        type: activityType,
        title,
        body,
        data: {
          circleId,
          circleName,
          ...details,
        },
        senderId: details.inviterId,
      });
    } catch (error) {
      console.error('Error creating circle notification:', error);
    }
  }

  /**
   * Base method to create a notification
   */
  private async createNotification(params: CreateNotificationParams): Promise<void> {
    const { userId, type, title, body, data, senderId } = params;

    try {
      // Create notification in database
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          body,
          data: {
            ...data,
            senderId,
            timestamp: new Date().toISOString(),
          },
          read: false,
        });

      if (error) {
        console.error('Error inserting notification:', error);
        throw error;
      }

      console.log('Notification created successfully:', { type, userId, title });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Remove a like notification when unlike happens
   */
  async removeLikeNotification(
    dateOwnerId: string,
    likerId: string,
    dateId: string
  ): Promise<void> {
    try {
      // Only remove unread notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', dateOwnerId)
        .eq('type', 'like')
        .eq('read', false)
        .eq('data->>dateId', dateId)
        .eq('data->>likerId', likerId);

      if (error) {
        console.error('Error removing like notification:', error);
      }
    } catch (error) {
      console.error('Error removing like notification:', error);
    }
  }

  /**
   * Create multiple notifications for mentioned users in a comment
   */
  async createMentionNotifications(
    comment: string,
    commenterId: string,
    commenterName: string,
    dateId: string,
    personName: string
  ): Promise<void> {
    try {
      // Extract @mentions from comment
      const mentionPattern = /@(\w+)/g;
      const mentions = comment.match(mentionPattern);
      
      if (!mentions || mentions.length === 0) return;

      // Get unique usernames
      const usernames = [...new Set(mentions.map(m => m.substring(1).toLowerCase()))];
      
      // Find users by username
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('username', usernames);

      if (!users || users.length === 0) return;

      // Create notifications for each mentioned user
      for (const user of users) {
        if (user.id === commenterId) continue; // Don't notify self

        await this.createNotification({
          userId: user.id,
          type: 'mention',
          title: 'You were mentioned',
          body: `${commenterName} mentioned you in a comment on a date with ${personName}`,
          data: {
            dateId,
            commenterId,
            commenterName,
            personName,
            comment,
          },
          senderId: commenterId,
        });
      }
    } catch (error) {
      console.error('Error creating mention notifications:', error);
    }
  }
}

export const notificationHelper = new NotificationHelper();