import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUri?: string;
}

interface SimpleCircleCardProps {
  id: string;
  name: string;
  memberCount: number;
  members: Friend[];
  isActive?: boolean;
  onPress: () => void;
}

export function SimpleCircleCard({
  name,
  memberCount,
  members,
  isActive = true,
  onPress,
}: SimpleCircleCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const renderAvatarStack = () => {
    const displayMembers = members.slice(0, 3);
    const remainingCount = memberCount - 3;
    
    return (
      <View style={styles.avatarStack}>
        {displayMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatarContainer,
              { 
                backgroundColor: colors.border,
                marginLeft: index > 0 ? -8 : 0,
                zIndex: 3 - index,
              }
            ]}
          >
            {member.avatarUri ? (
              <Image source={{ uri: member.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={[styles.remainingCount]}>
            <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
              +{remainingCount}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.leftContent}>
        <Text style={[styles.name, { color: colors.primary }]}>{name}</Text>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
            {memberCount} members
          </Text>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: colors.statusActive + '20' }]}>
              <Text style={[styles.activeText, { color: colors.statusActive }]}>Active</Text>
            </View>
          )}
        </View>
        <View style={styles.avatarSection}>
          {renderAvatarStack()}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  leftContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberCount: {
    fontSize: 14,
  },
  activeBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  remainingCount: {
    marginLeft: 4,
  },
  remainingText: {
    fontSize: 14,
  },
});