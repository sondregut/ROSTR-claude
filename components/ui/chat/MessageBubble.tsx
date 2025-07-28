import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CircleMessageWithSender } from '@/services/supabase/circleChat';

interface MessageBubbleProps {
  message: CircleMessageWithSender;
  isOwnMessage: boolean;
  showSenderInfo: boolean;
  onLongPress?: () => void;
}

export function MessageBubble({ 
  message, 
  isOwnMessage, 
  showSenderInfo,
  onLongPress 
}: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // System message rendering
  if (message.message_type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={[styles.systemMessage, { color: colors.textSecondary }]}>
          {message.content}
        </Text>
      </View>
    );
  }

  return (
    <Pressable onLongPress={onLongPress}>
      <View style={[
        styles.messageContainer,
        isOwnMessage && styles.ownMessageContainer
      ]}>
        {/* Avatar for other users */}
        {!isOwnMessage && showSenderInfo && (
          <Image 
            source={{ uri: message.sender_avatar || message.sender?.image_uri }} 
            style={styles.avatar} 
          />
        )}
        {!isOwnMessage && !showSenderInfo && (
          <View style={styles.avatarPlaceholder} />
        )}

        <View style={[
          styles.bubbleContainer,
          isOwnMessage && styles.ownBubbleContainer
        ]}>
          {/* Sender name for other users */}
          {!isOwnMessage && showSenderInfo && (
            <Text style={[styles.senderName, { color: colors.primary }]}>
              {message.sender_name || message.sender?.name}
            </Text>
          )}

          {/* Message bubble */}
          <View style={[
            styles.bubble,
            isOwnMessage ? {
              backgroundColor: colors.primary,
            } : {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            }
          ]}>
            {/* Image message */}
            {message.message_type === 'image' && message.media_url && (
              <Image 
                source={{ uri: message.media_url }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            )}

            {/* Text content */}
            <Text style={[
              styles.messageText,
              { color: isOwnMessage ? 'white' : colors.text }
            ]}>
              {message.content}
            </Text>

            {/* Timestamp */}
            <Text style={[
              styles.timestamp,
              { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
            ]}>
              {formatTime(message.created_at)}
              {isOwnMessage && message.is_read && (
                <Ionicons 
                  name="checkmark-done" 
                  size={14} 
                  color="rgba(255,255,255,0.7)" 
                  style={{ marginLeft: 4 }}
                />
              )}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: 8,
  },
  bubbleContainer: {
    maxWidth: '75%',
    alignItems: 'flex-start',
  },
  ownBubbleContainer: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 80,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  systemMessageContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  systemMessage: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
});