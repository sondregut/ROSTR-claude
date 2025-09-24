import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Notification, NotificationType } from '@/services/notifications/NotificationService';
import { formatDistanceToNow } from '@/lib/dateUtils';
import { FriendRequestService } from '@/services/FriendRequestService';
import { logger } from '@/utils/productionLogger';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onDelete?: () => void;
  onFriendRequestAction?: () => void;
}

export function NotificationCard({ notification, onPress, onDelete, onFriendRequestAction }: NotificationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAcceptFriendRequest = async (e: any) => {
    e.stopPropagation();
    if (!notification.data?.senderId) return;

    try {
      setIsProcessing(true);
      const success = await FriendRequestService.acceptFriendRequest(notification.data.senderId);

      if (success) {
        logger.debug('✅ Friend request accepted from notification');
        Alert.alert('Success', 'Friend request accepted!');
        onFriendRequestAction?.();
      } else {
        Alert.alert('Error', 'Failed to accept friend request. Please try again.');
      }
    } catch (error) {
      logger.debug('Failed to accept friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineFriendRequest = async (e: any) => {
    e.stopPropagation();
    if (!notification.data?.senderId) return;

    try {
      setIsProcessing(true);
      const success = await FriendRequestService.declineRequest(notification.data.senderId);

      if (success) {
        logger.debug('❌ Friend request declined from notification');
        Alert.alert('Success', 'Friend request declined.');
        onFriendRequestAction?.();
      } else {
        Alert.alert('Error', 'Failed to decline friend request. Please try again.');
      }
    } catch (error) {
      logger.debug('Failed to decline friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = (type: NotificationType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: colors.error };
      case 'reaction':
        return { name: 'happy', color: colors.primary };
      case 'comment':
        return { name: 'chatbubble', color: colors.primary };
      case 'mention':
        return { name: 'at', color: colors.primary };
      case 'poll_vote':
        return { name: 'stats-chart', color: colors.primary };
      case 'friend_date':
        return { name: 'calendar', color: colors.primary };
      case 'friend_roster':
        return { name: 'person-add', color: colors.primary };
      case 'friend_plan':
        return { name: 'calendar-outline', color: colors.primary };
      case 'friend_request':
        return { name: 'person-add', color: colors.primary };
      case 'friend_request_accepted':
        return { name: 'checkmark-circle', color: colors.success };
      case 'circle_invite':
        return { name: 'people', color: colors.primary };
      case 'circle_activity':
        return { name: 'people-circle', color: colors.primary };
      case 'reminder':
        return { name: 'alarm', color: colors.warning };
      case 'achievement':
        return { name: 'trophy', color: colors.success };
      case 'system':
      default:
        return { name: 'information-circle', color: colors.textSecondary };
    }
  };

  const icon = getIcon(notification.type);
  const timeAgo = formatDistanceToNow(notification.created_at);

  return (
    <Pressable
      style={[
        styles.container,
        { 
          backgroundColor: notification.read ? colors.background : colors.card,
          borderColor: colors.border,
        }
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
        <Ionicons name={icon.name} size={24} color={icon.color} />
      </View>

      <View style={styles.content}>
        <Text 
          style={[
            styles.title, 
            { 
              color: colors.text,
              fontWeight: notification.read ? '400' : '600',
            }
          ]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text 
          style={[styles.body, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {notification.body}
        </Text>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {timeAgo}
        </Text>
      </View>

      {notification.data?.imageUri && (
        <Image 
          source={{ uri: notification.data.imageUri }} 
          style={styles.image}
        />
      )}

      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}

      {/* Friend Request Action Buttons */}
      {notification.type === 'friend_request' && notification.data?.senderId && (
        <View style={styles.friendRequestActions}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Pressable
                style={[styles.actionButton, styles.declineButton, { borderColor: colors.border }]}
                onPress={handleDeclineFriendRequest}
                disabled={isProcessing}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>Decline</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
                onPress={handleAcceptFriendRequest}
                disabled={isProcessing}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Accept</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {onDelete && notification.type !== 'friend_request' && (
        <Pressable
          style={[styles.deleteButton, { zIndex: 10 }]}
          onPress={(e) => {
            console.log('Delete button pressed for notification');
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error || colors.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingRight: 56, // Make room for delete button
    borderBottomWidth: 1,
    position: 'relative',
    minHeight: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendRequestActions: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -18 }],
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  declineButton: {
    borderWidth: 1,
  },
  acceptButton: {},
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});