import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';

interface ProfileCardProps {
  id: string;
  name: string;
  avatarUri?: string;
  lastDate?: string;
  nextDate?: string;
  rating?: number;
  status?: 'active' | 'new' | 'fading' | 'ended';
  onPress?: () => void;
  onOptionsPress?: () => void;
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
}: ProfileCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getStatusColor = () => {
    switch(status) {
      case 'active': return colors.statusActive;
      case 'new': return colors.statusNew;
      case 'fading': return colors.statusFading;
      case 'ended': return colors.statusEnded;
      default: return colors.statusActive;
    }
  };

  const getStatusText = () => {
    switch(status) {
      case 'active': return 'Active';
      case 'new': return 'New';
      case 'fading': return 'Fading';
      case 'ended': return 'Ended';
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
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
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
              Last date: {lastDate} {rating > 0 && <Text style={{ color: colors.primary }}> • {formatRating(rating)}</Text>}
            </Text>
          )}
          
          {nextDate && (
            <View style={styles.nextDateContainer}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} style={styles.calendarIcon} />
              <Text style={[styles.nextDateText, { color: colors.primary }]}>Next: {nextDate}</Text>
            </View>
          )}
        </View>
        
        {status && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          </View>
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
    borderColor: '#f0f0f0',
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
    borderColor: '#f0f0f0',
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
