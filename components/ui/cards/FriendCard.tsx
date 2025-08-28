import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Friend } from '@/services/supabase/friends';

interface FriendCardProps {
  friend: Friend;
  onRemoveFriend?: (friendId: string) => void;
  showActions?: boolean;
}

export function FriendCard({ friend, onRemoveFriend, showActions = true }: FriendCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleProfilePress = () => {
    router.push(`/profile/${friend.username}`);
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveFriend?.(friend.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={handleProfilePress} style={styles.content}>
        <View style={styles.avatarContainer}>
          {friend.image_uri ? (
            <Image
              source={{ uri: friend.image_uri }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {friend.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {friend.name}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
            @{friend.username}
          </Text>
          {friend.bio && (
            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
              {friend.bio}
            </Text>
          )}
        </View>
      </Pressable>
      
      {showActions && (
        <View style={styles.actions}>
          <Pressable onPress={handleRemoveFriend} style={styles.actionButton}>
            <Ionicons name="person-remove" size={20} color={colors.error} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});