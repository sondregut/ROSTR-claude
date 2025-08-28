import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ContactMatchCardProps {
  id: string;
  name: string;
  username?: string;
  imageUri?: string;
  isFriend: boolean;
  isMutualContact: boolean;
  onPress: () => void;
  onAddFriend?: () => void;
  onMessage?: () => void;
}

export function ContactMatchCard({
  id,
  name,
  username,
  imageUri,
  isFriend,
  isMutualContact,
  onPress,
  onAddFriend,
  onMessage,
}: ContactMatchCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Avatar with mutual indicator */}
        <View style={styles.avatarContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isMutualContact && (
            <View style={[styles.mutualBadge, { backgroundColor: colors.secondary }]}>
              <Ionicons name="swap-horizontal" size={10} color="white" />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            {isMutualContact && (
              <View style={[styles.mutualPill, { backgroundColor: colors.secondary + '20' }]}>
                <Text style={[styles.mutualText, { color: colors.secondary }]}>
                  Mutual
                </Text>
              </View>
            )}
          </View>
          {username && (
            <Text style={[styles.username, { color: colors.textSecondary }]}>
              @{username}
            </Text>
          )}
          {!username && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              In your contacts
            </Text>
          )}
        </View>

        {/* Action Button */}
        <View style={styles.actions}>
          {isFriend ? (
            <Pressable
              style={[styles.messageButton, { backgroundColor: colors.primary + '20' }]}
              onPress={(e) => {
                e.stopPropagation();
                onMessage?.();
              }}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={(e) => {
                e.stopPropagation();
                onAddFriend?.();
              }}
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  mutualBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  mutualPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  mutualText: {
    fontSize: 11,
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});