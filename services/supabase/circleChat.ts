import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CircleMessage {
  id: string;
  circle_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  media_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CircleMessageWithSender extends CircleMessage {
  sender?: {
    id: string;
    name: string;
    username: string;
    image_uri: string;
  };
}

export interface TypingUser {
  userId: string;
  userName: string;
  userAvatar: string;
}

export class CircleChatService {
  private static activeChannels: Map<string, RealtimeChannel> = new Map();
  private static typingTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Send a message to a circle
   */
  static async sendCircleMessage(
    circleId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    content: string,
    messageType: 'text' | 'image' | 'system' = 'text',
    mediaUrl?: string
  ): Promise<CircleMessage> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          circle_id: circleId,
          sender_id: senderId,
          sender_name: senderName,
          sender_avatar: senderAvatar,
          content,
          message_type: messageType,
          media_url: mediaUrl,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return message;
    } catch (error) {
      console.error('Send circle message error:', error);
      throw error;
    }
  }

  /**
   * Get messages for a circle with pagination
   */
  static async getCircleMessages(
    circleId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CircleMessageWithSender[]> {
    try {
      console.log(`📨 Fetching messages for circle ${circleId}`);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            id,
            name,
            username,
            image_uri
          )
        `)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error fetching circle messages:', error);
        throw error;
      }

      console.log(`✅ Fetched ${messages?.length || 0} messages`);
      
      // Reverse to show oldest first (for proper chat order)
      return messages ? messages.reverse() : [];
    } catch (error) {
      console.error('💥 Get circle messages error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time messages in a circle
   */
  static subscribeToCircleMessages(
    circleId: string,
    onMessage: (message: CircleMessageWithSender) => void,
    onError?: (error: any) => void
  ): () => void {
    console.log(`🔌 Attempting to subscribe to circle ${circleId} messages...`);
    
    // First check if we can query messages at all
    const testAccess = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('circle_id', circleId)
          .limit(1);
          
        if (error) {
          console.error('❌ Cannot query messages:', error);
          console.log('💡 This usually means:');
          console.log('   1. RLS policies are not set up correctly');
          console.log('   2. User is not authenticated');
          console.log('   3. User is not a member of the circle');
          onError?.(new Error('Failed to access messages. Check RLS policies.'));
          return false;
        }
        
        console.log('✅ Message access test passed');
        return true;
      } catch (err) {
        console.error('💥 Message access test failed:', err);
        onError?.(err);
        return false;
      }
    };
    
    // Run the test
    testAccess().then(hasAccess => {
      if (!hasAccess) {
        console.error('⛔ Aborting subscription due to access issues');
        return;
      }
      
      const channelName = `circle-messages-${circleId}`;
      
      // Close existing channel if it exists
      const existingChannel = this.activeChannels.get(channelName);
      if (existingChannel) {
        existingChannel.unsubscribe();
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `circle_id=eq.${circleId}`,
          },
          async (payload) => {
            try {
              console.log('📩 New message received:', payload.new);
              
              // Fetch the complete message with sender info
              const { data: messageWithSender, error } = await supabase
                .from('messages')
                .select(`
                  *,
                  sender:users!messages_sender_id_fkey (
                    id,
                    name,
                    username,
                    image_uri
                  )
                `)
                .eq('id', payload.new.id)
                .single();

              if (error) {
                console.error('Error fetching message with sender:', error);
                onError?.(error);
                return;
              }

              onMessage(messageWithSender);
            } catch (error) {
              console.error('Real-time message error:', error);
              onError?.(error);
            }
          }
        )
        .subscribe((status, error) => {
          console.log(`📡 Circle messages subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Successfully subscribed to circle ${circleId} messages`);
            console.log('🔥 Real-time connection established!');
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Channel error for circle ${circleId}:`, error);
            console.log('💡 Common causes:');
            console.log('   1. Real-time not enabled on messages table');
            console.log('   2. Network/WebSocket issues');
            console.log('   3. Invalid authentication token');
            onError?.(new Error(`Failed to subscribe: ${error?.message || 'Channel error'}`));
          } else if (status === 'TIMED_OUT') {
            console.error(`⏱️ Subscription timed out for circle ${circleId}`);
            onError?.(new Error('Subscription timed out - check network connection'));
          } else if (status === 'CLOSED') {
            console.log(`🔒 Channel closed for circle ${circleId}`);
          }
        });

      this.activeChannels.set(channelName, channel);
    });

    // Return unsubscribe function that works even if subscription isn't set up yet
    return () => {
      const channelName = `circle-messages-${circleId}`;
      const channel = this.activeChannels.get(channelName);
      if (channel) {
        channel.unsubscribe();
        this.activeChannels.delete(channelName);
      }
    };
  }

  /**
   * Mark messages as read for a user in a circle
   */
  static async markCircleMessagesAsRead(
    circleId: string,
    userId: string,
    lastMessageId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('circle_message_reads')
        .upsert({
          circle_id: circleId,
          user_id: userId,
          last_read_message_id: lastMessageId,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'circle_id,user_id'
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Mark circle messages as read error:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for a circle
   */
  static async getCircleUnreadCount(
    circleId: string,
    userId: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_circle_unread_count', {
          p_circle_id: circleId,
          p_user_id: userId
        });

      if (error) {
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('Get circle unread count error:', error);
      return 0;
    }
  }

  /**
   * Set typing status for a user in a circle
   */
  static async setTypingStatus(
    circleId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      // Clear existing timer for this user
      const timerKey = `${circleId}-${userId}`;
      const existingTimer = this.typingTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      if (isTyping) {
        // Set typing status
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            circle_id: circleId,
            user_id: userId,
            is_typing: true,
            last_typed_at: new Date().toISOString(),
          }, {
            onConflict: 'circle_id,user_id'
          });

        if (error) {
          throw error;
        }

        // Auto-clear typing status after 5 seconds
        const timer = setTimeout(() => {
          this.setTypingStatus(circleId, userId, false);
        }, 5000);
        this.typingTimers.set(timerKey, timer);
      } else {
        // Clear typing status
        const { error } = await supabase
          .from('typing_indicators')
          .update({
            is_typing: false,
          })
          .eq('circle_id', circleId)
          .eq('user_id', userId);

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Set typing status error:', error);
    }
  }

  /**
   * Subscribe to typing indicators for a circle
   */
  static subscribeToCircleTyping(
    circleId: string,
    currentUserId: string,
    onTypingChange: (typingUsers: TypingUser[]) => void,
    onError?: (error: any) => void
  ): () => void {
    const channelName = `circle-typing-${circleId}`;
    
    // Close existing channel if it exists
    const existingChannel = this.activeChannels.get(channelName);
    if (existingChannel) {
      existingChannel.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `circle_id=eq.${circleId}`,
        },
        async () => {
          try {
            // Fetch all currently typing users
            const { data: typingIndicators, error } = await supabase
              .from('typing_indicators')
              .select(`
                user_id,
                is_typing,
                user:users!typing_indicators_user_id_fkey (
                  id,
                  name,
                  image_uri
                )
              `)
              .eq('circle_id', circleId)
              .eq('is_typing', true)
              .neq('user_id', currentUserId);

            if (error) {
              console.error('Error fetching typing users:', error);
              onError?.(error);
              return;
            }

            const typingUsers: TypingUser[] = typingIndicators
              ?.filter(indicator => indicator.user)
              .map(indicator => ({
                userId: indicator.user.id,
                userName: indicator.user.name,
                userAvatar: indicator.user.image_uri,
              })) || [];

            onTypingChange(typingUsers);
          } catch (error) {
            console.error('Typing indicator error:', error);
            onError?.(error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to circle ${circleId} typing indicators`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to circle ${circleId} typing indicators`);
          onError?.(new Error('Failed to subscribe to typing indicators'));
        }
      });

    this.activeChannels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.activeChannels.delete(channelName);
    };
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      // Verify user owns the message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) {
        throw new Error('Message not found');
      }

      if (message.sender_id !== userId) {
        throw new Error('Cannot delete message from another user');
      }

      // Delete message
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  /**
   * Send a system message (e.g., user joined/left)
   */
  static async sendSystemMessage(
    circleId: string,
    content: string
  ): Promise<CircleMessage> {
    return this.sendCircleMessage(
      circleId,
      'system',
      'System',
      '',
      content,
      'system'
    );
  }

  /**
   * Clean up all active channels
   */
  static cleanup(): void {
    // Clear all timers
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();

    // Unsubscribe from all channels
    this.activeChannels.forEach(channel => {
      channel.unsubscribe();
    });
    this.activeChannels.clear();
  }
}