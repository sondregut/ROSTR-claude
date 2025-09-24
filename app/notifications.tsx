import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationCard } from '@/components/ui/notifications/NotificationCard';
import { Notification } from '@/services/notifications/NotificationService';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
  }, [refreshNotifications]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    const { type, data } = notification;
    
    switch (type) {
      case 'like':
      case 'reaction':
      case 'comment':
        if (data?.dateId) {
          // Navigate to feed tab - could enhance to scroll to specific date
          router.push('/(tabs)');
        }
        break;
      
      case 'friend_date':
      case 'friend_roster':
      case 'friend_plan':
        if (data?.friendUsername) {
          // Navigate to friend's profile
          router.push(`/profile/${data.friendUsername}`);
        }
        break;
      
      case 'friend_request':
        if (data?.senderId) {
          // Navigate to sender's profile to accept/decline with refresh params
          // Use username for navigation, fallback to senderId if username not available
          const profileUrl = `/profile/${data.senderUsername || data.senderId}?fromNotification=true&refreshTimestamp=${Date.now()}`;
          router.push(profileUrl);
        }
        break;
      
      case 'friend_request_accepted':
        if (data?.accepterId) {
          // Navigate to accepter's profile with refresh params
          // Use username for navigation, fallback to accepterId if username not available
          const profileUrl = `/profile/${data.accepterUsername || data.accepterId}?fromNotification=true&refreshTimestamp=${Date.now()}`;
          router.push(profileUrl);
        }
        break;
      
      case 'circle_invite':
        if (data?.circleId) {
          router.push(`/circles/${data.circleId}`);
        }
        break;
      
      case 'message':
        // Navigate to direct message - would need to implement DM screen
        // For now, just mark as read
        break;
      
      case 'circle_message':
        if (data?.circleId) {
          router.push(`/circles/${data.circleId}`);
        }
        break;
      
      default:
        // Just mark as read, no navigation
        break;
    }
  }, [markAsRead, router]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting notification:', notificationId);
              await deleteNotification(notificationId);
              console.log('Notification deleted successfully');
            } catch (error) {
              console.error('Failed to delete notification:', error);
              Alert.alert(
                'Error',
                'Failed to delete notification. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, [deleteNotification]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const renderNotification = ({ item }: { item: Notification }) => {
    console.log('Rendering notification with delete capability:', item.id);
    return (
      <NotificationCard
        notification={item}
        onPress={() => handleNotificationPress(item)}
        onDelete={() => handleDeleteNotification(item.id)}
        onFriendRequestAction={handleRefresh}
      />
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name="notifications-off-outline" 
          size={64} 
          color={colors.textSecondary} 
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No notifications yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          When you get likes, comments, or other updates, they'll appear here
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    const hasUnread = notifications.some(n => !n.read);
    
    if (!hasUnread || notifications.length === 0) return null;

    return (
      <Pressable
        style={[styles.markAllButton, { borderColor: colors.border }]}
        onPress={handleMarkAllAsRead}
      >
        <Ionicons name="checkmark-done" size={20} color={colors.primary} />
        <Text style={[styles.markAllText, { color: colors.primary }]}>
          Mark all as read
        </Text>
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (!isLoading || notifications.length === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyListContent: {
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});