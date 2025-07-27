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
        return Colors.light.statusActive;
      case 'away':
        return Colors.light.statusFading;
      case 'offline':
      default:
        return Colors.light.textSecondary;
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
            { backgroundColor: getStatusColor(member.onlineStatus) }
          ]} />
        </View>

        {/* Member info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {member.name}
            </Text>
            
            {/* Role badge */}
            <View style={styles.roleContainer}>
              {getRoleIcon(member.role) && (
                <Text style={styles.roleIcon}>
                  {getRoleIcon(member.role)}
                </Text>
              )}
              <Text style={[
                styles.roleLabel,
                member.role === 'owner' && styles.ownerLabel,
                member.role === 'admin' && styles.adminLabel
              ]}>
                {getRoleLabel(member.role)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.username} numberOfLines={1}>
            @{member.username}
          </Text>
        </View>

        {/* Actions menu */}
        {showActions && (
          <Pressable
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuPressed
            ]}
            onPress={handleMenuPress}
          >
            <Ionicons 
              name="ellipsis-horizontal" 
              size={20} 
              color={Colors.light.textSecondary} 
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    borderColor: Colors.light.card,
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
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
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
    color: Colors.light.textSecondary,
  },
  ownerLabel: {
    color: Colors.light.statusFading,
  },
  adminLabel: {
    color: Colors.light.statusNew,
  },
  username: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '400',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  menuPressed: {
    backgroundColor: Colors.light.background,
  },
});