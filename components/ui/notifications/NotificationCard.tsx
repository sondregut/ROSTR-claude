import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Notification, NotificationType } from '@/services/notifications/NotificationService';
import { formatDistanceToNow } from '@/lib/dateUtils';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onDelete?: () => void;
}

export function NotificationCard({ notification, onPress, onDelete }: NotificationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

      {onDelete && (
        <Pressable
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
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
    borderBottomWidth: 1,
    position: 'relative',
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
    top: 8,
    right: 8,
    padding: 4,
  },
});