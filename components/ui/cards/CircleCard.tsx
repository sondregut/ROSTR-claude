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

interface CircleCardProps {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  members: Friend[];
  lastActivity?: string;
  isActive?: boolean;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export function CircleCard({
  name,
  description,
  memberCount,
  members,
  lastActivity,
  isActive = true,
  onPress,
  onOptionsPress,
}: CircleCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const renderAvatarStack = () => {
    const displayMembers = members.slice(0, 4);
    const remainingCount = memberCount - 4;
    
    return (
      <View style={styles.avatarStack}>
        {displayMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatarContainer,
              { 
                borderColor: colors.card,
                marginLeft: index > 0 ? -12 : 0,
                zIndex: 4 - index,
              }
            ]}
          >
            {member.avatarUri ? (
              <Image source={{ uri: member.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ))}
        {remainingCount > 0 && (
          <View
            style={[
              styles.avatarContainer,
              styles.moreAvatarsContainer,
              { 
                backgroundColor: colors.textSecondary,
                borderColor: colors.card,
                marginLeft: -12,
                zIndex: 0,
              }
            ]}
          >
            <Text style={styles.moreAvatarsText}>+{remainingCount}</Text>
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
          opacity: isActive ? 1 : 0.7,
        },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            {description && (
              <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>
          {onOptionsPress && (
            <Pressable
              style={styles.optionsButton}
              onPress={onOptionsPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        
        <View style={styles.membersSection}>
          {renderAvatarStack()}
          <View style={styles.memberInfo}>
            <Text style={[styles.memberCount, { color: colors.text }]}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
            {lastActivity && (
              <Text style={[styles.lastActivity, { color: colors.textSecondary }]}>
                Active {lastActivity}
              </Text>
            )}
          </View>
        </View>
        
        {!isActive && (
          <View style={[styles.inactiveBadge, { backgroundColor: colors.textSecondary + '20' }]}>
            <Text style={[styles.inactiveText, { color: colors.textSecondary }]}>Inactive</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
  },
  optionsButton: {
    padding: 4,
  },
  membersSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 16,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
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
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  moreAvatarsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAvatarsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  lastActivity: {
    fontSize: 12,
    marginTop: 2,
  },
  inactiveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: '500',
  },
});