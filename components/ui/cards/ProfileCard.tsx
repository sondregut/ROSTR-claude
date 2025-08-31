import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface ProfileCardProps {
  id: string;
  name: string;
  avatarUri?: string;
  lastDate?: string;
  nextDate?: string;
  rating?: number;
  status?: 'active' | 'new' | 'fading' | 'ended' | 'ghosted';
  onPress?: () => void;
  onOptionsPress?: () => void;
  onStatusPress?: (newStatus: 'active' | 'new' | 'fading' | 'ended' | 'ghosted') => void;
}

export function ProfileCard({
  name,
  avatarUri,
  lastDate,
  nextDate,
  rating = 0,
  status,
  onPress,
  onOptionsPress,
  onStatusPress,
}: ProfileCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Define the status cycle order
  const statusCycle: ('new' | 'active' | 'fading' | 'ended' | 'ghosted')[] = ['new', 'active', 'fading', 'ended', 'ghosted'];
  
  const handleStatusPress = () => {
    if (!onStatusPress || !status) return;
    
    // Find current status index
    const currentIndex = statusCycle.indexOf(status);
    // Get next status in cycle (wrap around to beginning)
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIndex];
    
    onStatusPress(nextStatus);
  };

  const getStatusColor = () => {
    switch(status) {
      case 'active': return colors.statusActive;
      case 'new': return colors.statusNew;
      case 'fading': return colors.statusFading;
      case 'ended': return colors.statusEnded;
      case 'ghosted': return colors.statusGhosted || colors.error;
      default: return colors.statusActive;
    }
  };

  const getStatusText = () => {
    switch(status) {
      case 'active': return 'Active';
      case 'new': return 'New';
      case 'fading': return 'Fading';
      case 'ended': return 'Ended';
      case 'ghosted': return 'Ghosted';
      default: return '';
    }
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1) + '/5';
  };

  return (
    <Pressable 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View profile for ${name}`}
    >
      <View style={styles.contentRow}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <OptimizedImage 
              source={{ uri: avatarUri }} 
              style={styles.avatar} 
              priority="high"
              onError={() => {
                console.log('[ProfileCard] Failed to load avatar:', avatarUri);
              }}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.background }]}>
              <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>
                {name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.primary }]}>{name}</Text>
          </View>
          
          {lastDate && (
            <Text style={[styles.dateInfo, { color: colors.textSecondary }]}>
              Last date: {lastDate} {rating != null && rating > 0 && <Text style={{ color: colors.primary }}> • {formatRating(rating)}</Text>}
            </Text>
          )}
          
          {nextDate && (
            <View style={styles.nextDateContainer}>
              <Ionicons name="calendar" size={16} color={colors.statusActive} style={styles.calendarIcon} />
              <Text style={[styles.nextDateText, { color: colors.text }]}>Next: {nextDate}</Text>
            </View>
          )}
        </View>
        
        {status && (
          <Pressable
            style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}
            onPress={handleStatusPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`Change status from ${getStatusText()}`}
          >
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          </Pressable>
        )}
        
        <Pressable 
          style={styles.actionsContainer}
          onPress={onOptionsPress}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    padding: 12,
    borderWidth: 1,
  },
  contentRow: {
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
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '500',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 'auto',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  nextDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 4,
  },
  nextDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 8,
  },
});
