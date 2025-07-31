import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'expo-router';

interface NotificationBellProps {
  size?: number;
  color?: string;
  showBadge?: boolean;
}

export function NotificationBell({ 
  size = 24, 
  color,
  showBadge = true 
}: NotificationBellProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { unreadCount } = useNotifications();
  const router = useRouter();
  
  const bellColor = color || colors.text;
  const hasUnread = showBadge && unreadCount > 0;

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View>
        <Ionicons 
          name={hasUnread ? "notifications" : "notifications-outline"} 
          size={size} 
          color={bellColor} 
        />
        {hasUnread && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});