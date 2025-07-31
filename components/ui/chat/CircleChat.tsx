import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { 
  CircleChatService, 
  CircleMessageWithSender, 
  TypingUser 
} from '@/services/supabase/circleChat';
import { CircleChatMockService } from '@/services/supabase/circleChatMock';
import { MemberData } from '@/components/ui/cards/MemberCard';
import { supabase } from '@/lib/supabase';

interface CircleChatProps {
  circleId: string;
  circleName: string;
  members: MemberData[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
}

export function CircleChat({ 
  circleId, 
  circleName,
  members, 
  currentUserId,
  currentUserName,
  currentUserAvatar
}: CircleChatProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [messages, setMessages] = useState<CircleMessageWithSender[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [useMockService, setUseMockService] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'mock'>('connecting');
  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<NodeJS.Timeout>();

  // Subscriptions
  const messageUnsubscribe = useRef<(() => void) | null>(null);
  const typingUnsubscribe = useRef<(() => void) | null>(null);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [circleId]);
  
  // Enhanced diagnostics and error handling
  useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 Running chat diagnostics for circle:', circleId);
      
      try {
        // 1. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('❌ Auth check failed:', authError || 'No user');
          console.log('💡 Chat requires authentication - please sign in');
          setUseMockService(true);
          setConnectionStatus('mock');
          return;
        }
        console.log('✅ Authenticated as:', user.id);
        
        // 2. Test circle access
        try {
          const { data: membership, error: memberError } = await supabase
            .from('circle_members')
            .select('*')
            .eq('circle_id', circleId)
            .eq('user_id', user.id)
            .single();
            
          if (memberError || !membership) {
            console.error('❌ User not a member of this circle:', memberError?.message);
            console.log('💡 Only circle members can access chat');
            setUseMockService(true);
            setConnectionStatus('mock');
            return;
          }
          console.log('✅ Circle membership confirmed');
        } catch (err) {
          console.error('💥 Circle membership check failed:', err);
          setUseMockService(true);
          setConnectionStatus('mock');
          return;
        }
        
        // 3. Test direct message query
        try {
          const { data: testMessages, error: queryError } = await supabase
            .from('messages')
            .select('*')
            .eq('circle_id', circleId)
            .limit(1);
            
          if (queryError) {
            console.error('❌ Message query failed:', queryError.message);
            console.log('💡 Database schema may need setup - switching to mock service');
            setUseMockService(true);
            setConnectionStatus('mock');
            return;
          }
          console.log('✅ Message query successful:', testMessages?.length || 0, 'messages found');
        } catch (err) {
          console.error('💥 Query error:', err);
          setUseMockService(true);
          setConnectionStatus('mock');
          return;
        }
        
        // 4. Check active channels
        const channels = supabase.getChannels();
        console.log('📡 Active channels:', channels.length);
        
        console.log('✅ All diagnostics passed - using real-time chat');
        setConnectionStatus('connected');
      } catch (error) {
        console.error('💥 Diagnostics failed:', error);
        setUseMockService(true);
        setConnectionStatus('error');
      }
    };
    
    runDiagnostics();
  }, [circleId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (useMockService) {
      console.log('📱 Using mock service for messages');
      const service = CircleChatMockService;
      
      // Mock subscriptions
      messageUnsubscribe.current = service.subscribeToCircleMessages(
        circleId,
        (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
        }
      );
      
      typingUnsubscribe.current = service.subscribeToCircleTyping(
        circleId,
        currentUserId,
        (users) => {
          setTypingUsers(users);
        }
      );
      
      return () => {
        messageUnsubscribe.current?.();
        typingUnsubscribe.current?.();
      };
    }
    
    console.log('🔌 Setting up real-time subscriptions for circle:', circleId);
    
    // Set up subscriptions for both possible table structures
    const messageChannel = supabase
      .channel(`circle-messages-${circleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'circle_chat_messages'
        },
        async (payload) => {
          console.log('📩 New message via real-time (circle_chat_messages):', payload);
          
          if (payload.new && payload.new.circle_id === circleId) {
            // Check if we already have this message (avoid duplicates from our own sends)
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === payload.new.id);
              if (messageExists) {
                return prev;
              }
              
              // Immediately add the message with available data
              const immediateMessage = {
                ...payload.new,
                sender: members.find(m => m.id === payload.new.sender_id) || {
                  id: payload.new.sender_id,
                  name: payload.new.sender_name || 'Unknown',
                  username: 'unknown',
                  image_uri: payload.new.sender_avatar || ''
                }
              };
              
              return [...prev, immediateMessage];
            });
            
            // Optionally fetch complete data in background
            try {
              const { data: messageWithSender, error } = await supabase
                .from('circle_chat_messages')
                .select(`
                  *,
                  sender:users!circle_chat_messages_sender_id_fkey (
                    id,
                    name,
                    username,
                    image_uri
                  )
                `)
                .eq('id', payload.new.id)
                .single();
                
              if (!error && messageWithSender) {
                // Update the message with complete data
                setMessages(prev => prev.map(msg => 
                  msg.id === messageWithSender.id ? messageWithSender : msg
                ));
              }
            } catch (err) {
              console.error('Error fetching complete message from circle_chat_messages:', err);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('📩 New message via real-time (messages):', payload);
          
          // If we get a message for this circle, add it
          if (payload.new && payload.new.circle_id === circleId) {
            // Check if we already have this message (avoid duplicates from our own sends)
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === payload.new.id);
              if (messageExists) {
                return prev;
              }
              
              // Immediately add the message with available data
              const immediateMessage = {
                ...payload.new,
                sender: members.find(m => m.id === payload.new.sender_id) || {
                  id: payload.new.sender_id,
                  name: payload.new.sender_name || 'Unknown',
                  username: 'unknown',
                  image_uri: payload.new.sender_avatar || ''
                }
              };
              
              return [...prev, immediateMessage];
            });
            
            // Fetch complete message with sender info in background
            try {
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
                
              if (!error && messageWithSender) {
                // Update the message with complete data
                setMessages(prev => prev.map(msg => 
                  msg.id === messageWithSender.id ? messageWithSender : msg
                ));
              }
            } catch (err) {
              console.error('Error fetching complete message from messages:', err);
            }
          }
        }
      )
      .subscribe((status, error) => {
        console.log(`📡 Message channel status: ${status}`);
        if (error) {
          console.error('❌ Message channel error:', error);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to messages');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Failed to subscribe, switching to mock service');
          setUseMockService(true);
        }
      });
    
    // Typing indicators with simpler approach  
    const typingChannel = supabase
      .channel(`circle-typing-${circleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators'
        },
        async () => {
          // Fetch current typing users
          try {
            const { data: typingData } = await supabase
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
              
            if (typingData) {
              const typingUsers = typingData
                .filter(t => t.user)
                .map(t => ({
                  userId: t.user.id,
                  userName: t.user.name,
                  userAvatar: t.user.image_uri
                }));
              setTypingUsers(typingUsers);
            }
          } catch (err) {
            console.error('Error fetching typing users:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log(`⌨️ Typing channel status: ${status}`);
      });
    
    // Store unsubscribe functions
    messageUnsubscribe.current = () => messageChannel.unsubscribe();
    typingUnsubscribe.current = () => typingChannel.unsubscribe();
    
    // Cleanup
    return () => {
      messageChannel.unsubscribe();
      typingChannel.unsubscribe();
    };
  }, [circleId, currentUserId, useMockService]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      console.log(`🔍 Loading messages for circle ${circleId}`);
      
      const service = useMockService ? CircleChatMockService : CircleChatService;
      const fetchedMessages = await service.getCircleMessages(circleId);
      console.log(`📨 Loaded ${fetchedMessages.length} messages`);
      setMessages(fetchedMessages);
      
      // Mark last message as read (with error handling)
      if (fetchedMessages.length > 0 && !useMockService) {
        try {
          const lastMessage = fetchedMessages[fetchedMessages.length - 1];
          if (lastMessage && lastMessage.id) {
            await service.markCircleMessagesAsRead(
              circleId,
              currentUserId,
              lastMessage.id
            );
          } else {
            console.warn('⚠️ Last message has no valid ID, skipping mark as read');
          }
        } catch (markError) {
          console.error('❌ Error marking messages as read:', markError);
          console.log('💡 Chat will continue to function without read tracking');
          // Don't switch to mock service for read tracking errors
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading messages:', error);
      
      // Check if this is a critical error or just a read tracking issue
      const isCriticalError = error?.code !== '23503' && 
                             !error?.message?.includes('circle_message_reads') &&
                             !error?.message?.includes('foreign key constraint');
      
      if (isCriticalError && !useMockService) {
        console.log('🔄 Switching to mock service for messages due to critical error');
        setUseMockService(true);
        setConnectionStatus('mock');
        
        // Retry with mock service
        try {
          const mockMessages = await CircleChatMockService.getCircleMessages(circleId);
          setMessages(mockMessages);
        } catch (mockError) {
          console.error('❌ Mock service also failed:', mockError);
          setConnectionStatus('error');
          Alert.alert(
            'Error', 
            'Unable to load messages. Please check your connection.'
          );
        }
      } else if (!isCriticalError) {
        console.log('💡 Non-critical error (likely read tracking), continuing with real service');
        setConnectionStatus('connected');
        // Don't switch to mock for read tracking errors
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (isSending || !content.trim()) return;

    // Create optimistic message
    const optimisticMessage: CircleMessageWithSender = {
      id: `temp-${Date.now()}`,
      circle_id: circleId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_avatar: currentUserAvatar,
      content: content.trim(),
      message_type: 'text',
      is_read: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: currentUserId,
        name: currentUserName,
        username: currentUserName.toLowerCase().replace(' ', '_'),
        image_uri: currentUserAvatar
      }
    };

    try {
      setIsSending(true);
      
      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      const service = useMockService ? CircleChatMockService : CircleChatService;
      const sentMessage = await service.sendCircleMessage(
        circleId,
        currentUserId,
        currentUserName,
        currentUserAvatar,
        content,
        'text'
      );

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...sentMessage, sender: optimisticMessage.sender }
          : msg
      ));

      // Clear typing status
      await service.setTypingStatus(circleId, currentUserId, false);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = useCallback(() => {
    // Clear existing timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    const service = useMockService ? CircleChatMockService : CircleChatService;
    
    // Set typing status
    service.setTypingStatus(circleId, currentUserId, true);

    // Auto-clear after 3 seconds of inactivity
    typingTimerRef.current = setTimeout(() => {
      service.setTypingStatus(circleId, currentUserId, false);
    }, 3000);
  }, [circleId, currentUserId, useMockService]);

  const renderMessage = ({ item, index }: { item: CircleMessageWithSender; index: number }) => {
    const isOwnMessage = item.sender_id === currentUserId;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showSenderInfo = !previousMessage || 
      previousMessage.sender_id !== item.sender_id ||
      item.message_type === 'system';

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showSenderInfo={showSenderInfo}
        onLongPress={() => {
          if (isOwnMessage && item.message_type !== 'system') {
            Alert.alert(
              'Message Options',
              '',
              [
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleDeleteMessage(item.id),
                },
                {
                  text: 'Copy',
                  onPress: () => {
                    // TODO: Implement copy to clipboard
                  },
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ]
            );
          }
        }}
      />
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const service = useMockService ? CircleChatMockService : CircleChatService;
      await service.deleteMessage(messageId, currentUserId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const keyExtractor = (item: CircleMessageWithSender) => item.id;

  const ConnectionStatus = () => {
    if (connectionStatus === 'connecting') {
      return (
        <View style={[styles.statusBar, { backgroundColor: colors.primary }]}>
          <Text style={styles.statusText}>🔄 Connecting to chat...</Text>
        </View>
      );
    }
    
    if (connectionStatus === 'mock') {
      return (
        <View style={[styles.statusBar, { backgroundColor: '#FF8C00' }]}>
          <Text style={styles.statusText}>⚠️ Demo mode - messages won't persist</Text>
        </View>
      );
    }
    
    if (connectionStatus === 'error') {
      return (
        <View style={[styles.statusBar, { backgroundColor: '#FF4444' }]}>
          <Text style={styles.statusText}>❌ Connection failed - using demo mode</Text>
        </View>
      );
    }
    
    return null;
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No messages yet. Start the conversation!
      </Text>
    </View>
  );

  const ListFooterComponent = () => (
    <>
      {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} />}
      <View style={{ height: 20 }} />
    </>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ConnectionStatus />
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        inverted={false}
        onContentSizeChange={() => {
          // Auto-scroll to bottom when new messages arrive
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }}
        onLayout={() => {
          // Scroll to bottom when chat is first loaded
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      />
      
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        placeholder={`Message ${circleName}...`}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  statusBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});