import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Avatar } from '../Avatar';
import { useColorScheme } from '@/hooks/useColorScheme';

export type MemberRole = 'owner' | 'admin' | 'member';
export type OnlineStatus = 'online' | 'offline' | 'away';

export interface MemberData {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: MemberRole;
  onlineStatus: OnlineStatus;
  isCurrentUser?: boolean;
}

interface MemberCardProps {
  member: MemberData;
  onPress?: () => void;
  onMenuPress?: () => void;
  showActions?: boolean;
  currentUserRole?: MemberRole;
}

export function MemberCard({ 
  member, 
  onPress, 
  onMenuPress, 
  showActions = true,
  currentUserRole = 'member'
}: MemberCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case 'owner':
        return '👑';
      case 'admin':
        return '🛡️';
      default:
        return null;
    }
  };

  const getRoleLabel = (role: MemberRole) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'member':
        return 'Member';
    }
  };

  const getStatusColor = (status: OnlineStatus) => {
    switch (status) {
      case 'online':
        return colors.statusActive;
      case 'away':
        return colors.statusFading;
      case 'offline':
      default:
        return colors.textSecondary;
    }
  };

  const canShowActions = () => {
    if (!showActions || member.isCurrentUser) return false;
    
    // Owners can manage everyone except other owners
    if (currentUserRole === 'owner' && member.role !== 'owner') return true;
    
    // Admins can manage members only
    if (currentUserRole === 'admin' && member.role === 'member') return true;
    
    return false;
  };

  const handleMenuPress = () => {
    if (!onMenuPress) {
      // Default menu actions
      const options = [];
      
      options.push('View Profile');
      options.push('Send Message');
      
      if (canShowActions()) {
        if (currentUserRole === 'owner' && member.role === 'member') {
          options.push('Make Admin');
        }
        if (currentUserRole === 'owner' && member.role === 'admin') {
          options.push('Remove Admin');
        }
        options.push('Remove from Circle');
      }
      
      options.push('Block User');
      options.push('Cancel');

      Alert.alert(
        member.name,
        'Choose an action',
        options.map((option, index) => ({
          text: option,
          style: option === 'Cancel' ? 'cancel' : 
                 (option.includes('Remove') || option.includes('Block')) ? 'destructive' : 'default',
          onPress: () => {
            if (option !== 'Cancel') {
              console.log(`${option} for ${member.name}`);
            }
          }
        }))
      );
    } else {
      onMenuPress();
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Avatar with status indicator */}
        <View style={styles.avatarContainer}>
          <Avatar
            uri={member.avatar}
            name={member.name}
            size={48}
          />
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(member.onlineStatus), borderColor: colors.card }
          ]} />
        </View>

        {/* Member info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {member.name}
            </Text>
            
            {/* Role badge */}
            <View style={[styles.roleContainer, { backgroundColor: colors.background }]}>
              {getRoleIcon(member.role) && (
                <Text style={styles.roleIcon}>
                  {getRoleIcon(member.role)}
                </Text>
              )}
              <Text style={[
                styles.roleLabel,
                { color: colors.textSecondary },
                member.role === 'owner' && { color: colors.statusFading },
                member.role === 'admin' && { color: colors.statusNew }
              ]}>
                {getRoleLabel(member.role)}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
            @{member.username}
          </Text>
        </View>

        {/* Actions menu */}
        {showActions && (
          <Pressable
            style={({ pressed }) => [
              styles.menuButton,
              pressed && [styles.menuPressed, { backgroundColor: colors.background }]
            ]}
            onPress={handleMenuPress}
          >
            <Ionicons 
              name="ellipsis-horizontal" 
              size={20} 
              color={colors.textSecondary} 
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  username: {
    fontSize: 14,
    fontWeight: '400',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  menuPressed: {},
});