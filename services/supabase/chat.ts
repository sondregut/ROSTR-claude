import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export interface ConversationWithLastMessage extends Conversation {
  last_message?: Message;
  other_participant?: {
    id: string;
    name: string;
    username: string;
    image_uri: string;
  };
  unread_count?: number;
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    name: string;
    username: string;
    image_uri: string;
  };
}

export class ChatService {
  private static activeChannels: Map<string, RealtimeChannel> = new Map();

  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(participant1Id: string, participant2Id: string): Promise<Conversation> {
    try {
      // Ensure consistent ordering of participants
      const [user1, user2] = [participant1Id, participant2Id].sort();

      // Try to find existing conversation
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1.eq.${user1},participant_2.eq.${user2}),and(participant_1.eq.${user2},participant_2.eq.${user1})`)
        .single();

      if (existingConversation && !fetchError) {
        return existingConversation;
      }

      // Create new conversation if none exists
      const conversationData: ConversationInsert = {
        participant_1: user1,
        participant_2: user2,
      };

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return newConversation;
    } catch (error) {
      console.error('Get or create conversation error:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations with last messages and other participant info
   */
  static async getUserConversations(userId: string): Promise<ConversationWithLastMessage[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!conversations_last_message_id_fkey (
            id,
            content,
            message_type,
            created_at,
            sender_id
          )
        `)
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Fetch other participants' info and unread counts
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          const otherParticipantId = conversation.participant_1 === userId 
            ? conversation.participant_2 
            : conversation.participant_1;

          // Get other participant info
          const { data: otherParticipant } = await supabase
            .from('users')
            .select('id, name, username, image_uri')
            .eq('id', otherParticipantId)
            .single();

          // Get unread message count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('is_read', false)
            .neq('sender_id', userId);

          return {
            ...conversation,
            last_message: conversation.messages?.[0] || null,
            other_participant: otherParticipant,
            unread_count: unreadCount || 0,
          };
        })
      );

      return conversationsWithDetails;
    } catch (error) {
      console.error('Get user conversations error:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessageWithSender[]> {
    try {
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
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Reverse to show oldest first
      return messages.reverse();
    } catch (error) {
      console.error('Get conversation messages error:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'location' = 'text',
    mediaUrl?: string
  ): Promise<Message> {
    try {
      const messageData: MessageInsert = {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        media_url: mediaUrl,
      };

      const { data: message, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return message;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  /**
   * Send image message
   */
  static async sendImageMessage(
    conversationId: string,
    senderId: string,
    imageUri: string,
    caption: string = ''
  ): Promise<Message> {
    try {
      // Upload image to storage
      const { StorageService } = await import('./storage');
      const uploadResult = await StorageService.uploadChatMedia(imageUri, senderId, 'image');

      // Send message with image URL
      return await this.sendMessage(
        conversationId,
        senderId,
        caption,
        'image',
        uploadResult.url
      );
    } catch (error) {
      console.error('Send image message error:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', userId); // Don't mark own messages as read

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Mark messages as read error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time messages for a conversation
   */
  static subscribeToConversation(
    conversationId: string,
    onMessage: (message: MessageWithSender) => void,
    onError?: (error: any) => void
  ): () => void {
    const channelName = `conversation-${conversationId}`;
    
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
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          try {
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
              return;
            }

            onMessage(messageWithSender);
          } catch (error) {
            console.error('Real-time message error:', error);
            onError?.(error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to conversation ${conversationId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to conversation ${conversationId}`);
          onError?.(new Error('Failed to subscribe to conversation'));
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
   * Subscribe to real-time conversation updates (for conversation list)
   */
  static subscribeToUserConversations(
    userId: string,
    onConversationUpdate: (conversation: Conversation) => void,
    onError?: (error: any) => void
  ): () => void {
    const channelName = `user-conversations-${userId}`;
    
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
          table: 'conversations',
          filter: `or(participant_1.eq.${userId},participant_2.eq.${userId})`,
        },
        (payload) => {
          try {
            onConversationUpdate(payload.new as Conversation);
          } catch (error) {
            console.error('Real-time conversation update error:', error);
            onError?.(error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to user conversations for ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to user conversations for ${userId}`);
          onError?.(new Error('Failed to subscribe to user conversations'));
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
   * Get typing indicator status
   */
  static async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const channel = supabase.channel(`typing-${conversationId}`);
      
      if (isTyping) {
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: userId, typing: true }
        });
      } else {
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: userId, typing: false }
        });
      }
    } catch (error) {
      console.error('Set typing status error:', error);
    }
  }

  /**
   * Subscribe to typing indicators
   */
  static subscribeToTyping(
    conversationId: string,
    currentUserId: string,
    onTypingChange: (userId: string, isTyping: boolean) => void
  ): () => void {
    const channelName = `typing-${conversationId}`;
    
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, typing } = payload.payload;
        // Don't show typing indicator for current user
        if (user_id !== currentUserId) {
          onTypingChange(user_id, typing);
        }
      })
      .subscribe();

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
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
        .select('sender_id, media_url')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) {
        throw new Error('Message not found');
      }

      if (message.sender_id !== userId) {
        throw new Error('Cannot delete message from another user');
      }

      // Delete associated media file if exists
      if (message.media_url) {
        try {
          const { StorageService } = await import('./storage');
          const urlParts = message.media_url.split('/');
          const filename = urlParts[urlParts.length - 1];
          const path = `${userId}/${filename}`;
          await StorageService.deleteFile('chat-media', path);
        } catch (mediaError) {
          console.warn('Failed to delete media file:', mediaError);
        }
      }

      // Delete message from database
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
   * Search messages in a conversation
   */
  static async searchMessages(
    conversationId: string,
    query: string,
    limit: number = 20
  ): Promise<MessageWithSender[]> {
    try {
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
        .eq('conversation_id', conversationId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return messages;
    } catch (error) {
      console.error('Search messages error:', error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  static async getConversationStats(conversationId: string): Promise<{
    totalMessages: number;
    mediaCount: number;
    participantMessageCounts: Record<string, number>;
  }> {
    try {
      // Get total message count
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      // Get media message count
      const { count: mediaCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .not('media_url', 'is', null);

      // Get message counts by participant
      const { data: messageCounts } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('conversation_id', conversationId);

      const participantMessageCounts: Record<string, number> = {};
      messageCounts?.forEach(msg => {
        participantMessageCounts[msg.sender_id] = (participantMessageCounts[msg.sender_id] || 0) + 1;
      });

      return {
        totalMessages: totalMessages || 0,
        mediaCount: mediaCount || 0,
        participantMessageCounts,
      };
    } catch (error) {
      console.error('Get conversation stats error:', error);
      throw error;
    }
  }

  /**
   * Clean up all active channels
   */
  static cleanup(): void {
    this.activeChannels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.activeChannels.clear();
  }
}