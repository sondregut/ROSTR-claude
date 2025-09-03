import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FriendRequestService, FriendRequest } from '@/services/FriendRequestService';
import * as Haptics from 'expo-haptics';

export default function FriendRequestsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const loadRequests = useCallback(async () => {
    try {
      const [pending, sent] = await Promise.all([
        FriendRequestService.getPendingRequests(),
        FriendRequestService.getSentRequests(),
      ]);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRequests();
  }, [loadRequests]);

  const handleAcceptRequest = useCallback(async (request: FriendRequest) => {
    Alert.alert(
      'Accept Friend Request',
      `Accept friend request from ${request.user?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const success = await FriendRequestService.acceptFriendRequest(request.user_id);
              if (success) {
                Alert.alert('Success', `You are now friends with ${request.user?.name}!`);
                // Remove from pending list
                setPendingRequests(prev => prev.filter(r => r.id !== request.id));
              } else {
                Alert.alert('Error', 'Failed to accept friend request');
              }
            } catch (error) {
              console.error('Error accepting friend request:', error);
              Alert.alert('Error', 'Failed to accept friend request');
            }
          },
        },
      ]
    );
  }, []);

  const handleRejectRequest = useCallback(async (request: FriendRequest) => {
    Alert.alert(
      'Decline Friend Request',
      `Decline friend request from ${request.user?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const success = await FriendRequestService.rejectFriendRequest(request.user_id);
              if (success) {
                // Remove from pending list
                setPendingRequests(prev => prev.filter(r => r.id !== request.id));
              } else {
                Alert.alert('Error', 'Failed to decline friend request');
              }
            } catch (error) {
              console.error('Error rejecting friend request:', error);
              Alert.alert('Error', 'Failed to decline friend request');
            }
          },
        },
      ]
    );
  }, []);

  const handleCancelRequest = useCallback(async (request: FriendRequest) => {
    Alert.alert(
      'Cancel Friend Request',
      `Cancel friend request to ${request.user?.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const success = await FriendRequestService.cancelFriendRequest(request.friend_id);
              if (success) {
                // Remove from sent list
                setSentRequests(prev => prev.filter(r => r.id !== request.id));
              } else {
                Alert.alert('Error', 'Failed to cancel friend request');
              }
            } catch (error) {
              console.error('Error canceling friend request:', error);
              Alert.alert('Error', 'Failed to cancel friend request');
            }
          },
        },
      ]
    );
  }, []);

  const handleViewProfile = useCallback(async (request: FriendRequest) => {
    // First accept the request, then view profile
    Alert.alert(
      'Accept & View Profile',
      `Accept friend request from ${request.user?.name} to view their profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & View',
          onPress: async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const success = await FriendRequestService.acceptFriendRequest(request.user_id);
              if (success) {
                // Remove from pending list
                setPendingRequests(prev => prev.filter(r => r.id !== request.id));
                // Navigate to profile
                if (request.user?.username) {
                  router.push(`/profile/${request.user.username}`);
                }
              } else {
                Alert.alert('Error', 'Failed to accept friend request');
              }
            } catch (error) {
              console.error('Error accepting friend request:', error);
              Alert.alert('Error', 'Failed to accept friend request');
            }
          },
        },
      ]
    );
  }, [router]);

  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const isReceived = activeTab === 'received';
    
    return (
      <View style={[styles.requestCard, { backgroundColor: colors.card }]}>
        <Pressable
          style={styles.requestInfo}
          onPress={() => isReceived && handleViewProfile(item)}
        >
          {item.user?.image_uri ? (
            <Image source={{ uri: item.user.image_uri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.cardBorder }]}>
              <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                {item.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.user?.name || 'Unknown User'}
            </Text>
            <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
              @{item.user?.username || 'unknown'}
            </Text>
            <Text style={[styles.requestTime, { color: colors.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </Pressable>

        <View style={styles.actionButtons}>
          {isReceived ? (
            <>
              <Pressable
                style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAcceptRequest(item)}
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.declineButton, { backgroundColor: colors.error }]}
                onPress={() => handleRejectRequest(item)}
              >
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.actionButton, styles.cancelButton, { borderColor: colors.error }]}
              onPress={() => handleCancelRequest(item)}
            >
              <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={activeTab === 'received' ? 'people-outline' : 'send-outline'}
          size={64}
          color={colors.textSecondary}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {activeTab === 'received' ? 'No pending requests' : 'No sent requests'}
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {activeTab === 'received'
            ? 'Friend requests from others will appear here'
            : 'Friend requests you send will appear here'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Friend Requests',
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

      <View style={[styles.tabContainer, { borderBottomColor: colors.cardBorder }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'received' && styles.activeTab,
            activeTab === 'received' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('received')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'received' ? colors.primary : colors.textSecondary },
            ]}
          >
            Received ({pendingRequests.length})
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'sent' && styles.activeTab,
            activeTab === 'sent' && { borderBottomColor: colors.primary },
          ]}
          onPress={() => setActiveTab('sent')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'sent' ? colors.primary : colors.textSecondary },
            ]}
          >
            Sent ({sentRequests.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={activeTab === 'received' ? pendingRequests : sentRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          (activeTab === 'received' ? pendingRequests : sentRequests).length === 0 &&
            styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmpty()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyListContent: {
    justifyContent: 'center',
  },
  requestCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  requestTime: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {},
  declineButton: {},
  cancelButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    width: 'auto',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
});