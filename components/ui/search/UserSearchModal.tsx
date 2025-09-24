import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useRouter } from 'expo-router';
import { FriendsService } from '@/services/supabase/friends';
import { FriendRequestService } from '@/services/FriendRequestService';

interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onFriendAdded?: () => void;
}

interface SearchUser {
  id: string;
  name: string;
  username: string;
  image_uri?: string;
  bio?: string;
  friendshipStatus?: 'none' | 'pending_sent' | 'pending_received' | 'friends';
}

export function UserSearchModal({ visible, onClose, onFriendAdded }: UserSearchModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const auth = useSafeAuth();
  const user = auth?.user;
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingFriends, setAddingFriends] = useState<Set<string>>(new Set());
  const searchTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Clear search when modal closes
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible]);

  useEffect(() => {
    // Debounced search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!searchQuery || searchQuery.length < 2) return;

    try {
      setIsSearching(true);

      // Search by username or name
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, image_uri, bio')
        .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .neq('id', user?.id) // Exclude current user
        .limit(20);

      if (error) throw error;

      // Check friendship status for each result
      if (data && data.length > 0) {
        const resultsWithFriendship = await Promise.all(
          data.map(async (u) => {
            const friendshipStatus = await FriendRequestService.getFriendshipStatus(u.id);
            return {
              ...u,
              friendshipStatus,
            };
          })
        );

        setSearchResults(resultsWithFriendship);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      setAddingFriends(prev => new Set(prev).add(friendId));

      // Use FriendRequestService for proper pending state handling
      const success = await FriendRequestService.sendFriendRequest(friendId);

      if (success) {
        // Update local state to show request sent
        setSearchResults(prev =>
          prev.map(u => u.id === friendId ? { ...u, friendshipStatus: 'pending_sent' } : u)
        );

        onFriendAdded?.();
        Alert.alert('Success', 'Friend request sent!');
      } else {
        Alert.alert('Error', 'Failed to send friend request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    } finally {
      setAddingFriends(prev => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const cancelFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      setAddingFriends(prev => new Set(prev).add(friendId));

      // Use FriendRequestService to cancel the request
      const success = await FriendRequestService.cancelFriendRequest(friendId);

      if (success) {
        // Update local state to show request cancelled
        setSearchResults(prev =>
          prev.map(u => u.id === friendId ? { ...u, friendshipStatus: 'none' } : u)
        );

        Alert.alert('Success', 'Friend request cancelled.');
      } else {
        Alert.alert('Error', 'Failed to cancel friend request. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      Alert.alert('Error', 'Failed to cancel friend request. Please try again.');
    } finally {
      setAddingFriends(prev => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      setAddingFriends(prev => new Set(prev).add(friendId));

      const success = await FriendRequestService.acceptFriendRequest(friendId);
      
      if (success) {
        // Update local state to show friends
        setSearchResults(prev => 
          prev.map(u => u.id === friendId ? { ...u, friendshipStatus: 'friends' } : u)
        );
        
        onFriendAdded?.();
        Alert.alert('Success', 'Friend request accepted!');
      } else {
        Alert.alert('Error', 'Failed to accept friend request. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    } finally {
      setAddingFriends(prev => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  const renderUser = ({ item }: { item: SearchUser }) => {
    const isAdding = addingFriends.has(item.id);
    
    return (
      <Pressable
        style={[styles.userItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          onClose();
          router.push(`/profile/${item.username}`);
        }}
      >
        <View style={styles.userInfo}>
          {item.image_uri ? (
            <Image source={{ uri: item.image_uri }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
              @{item.username}
            </Text>
            {item.bio && (
              <Text 
                style={[styles.userBio, { color: colors.textSecondary }]} 
                numberOfLines={1}
              >
                {item.bio}
              </Text>
            )}
          </View>
        </View>

        {item.friendshipStatus === 'none' && (
          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: colors.primary },
              isAdding && styles.addingButton
            ]}
            onPress={(e) => {
              e.stopPropagation();
              sendFriendRequest(item.id);
            }}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color="white" />
                <Text style={styles.addButtonText}>Add Friend</Text>
              </>
            )}
          </Pressable>
        )}

        {item.friendshipStatus === 'pending_sent' && (
          <Pressable
            style={[
              styles.cancelRequestButton,
              { backgroundColor: colors.textSecondary + '20', borderColor: colors.textSecondary },
              isAdding && styles.addingButton
            ]}
            onPress={(e) => {
              e.stopPropagation();
              cancelFriendRequest(item.id);
            }}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                <Text style={[styles.cancelRequestButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </>
            )}
          </Pressable>
        )}

        {item.friendshipStatus === 'pending_received' && (
          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: colors.success },
              isAdding && styles.addingButton
            ]}
            onPress={(e) => {
              e.stopPropagation();
              acceptFriendRequest(item.id);
            }}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.addButtonText}>Accept</Text>
              </>
            )}
          </Pressable>
        )}

        {item.friendshipStatus === 'friends' && (
          <View style={[styles.friendBadge, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.friendText, { color: colors.success }]}>Friends</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>Search Users</Text>
          
          <View style={styles.cancelButton} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by username or name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Results */}
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Searching...</Text>
          </View>
        ) : searchQuery.length < 2 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Find Friends by Username
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start typing to search for users
            </Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Users Found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try searching with a different username or name
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderUser}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    width: 60,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    marginBottom: 2,
  },
  userBio: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addingButton: {
    minWidth: 80,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  friendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cancelRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  cancelRequestButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
});