import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Avatar } from '../Avatar';

export type DateStatus = 'active' | 'new' | 'fading' | 'ended' | 'ghosted';

export interface RosterPersonData {
  id: string;
  name: string;
  avatar?: string;
  status: DateStatus;
  lastDate?: string;
  totalDates: number;
  averageRating?: number;
  nextDate?: string;
}

interface RosterPersonCardProps {
  person: RosterPersonData;
  ownerName: string;
  onPress?: () => void;
}

export function RosterPersonCard({ person, ownerName, onPress }: RosterPersonCardProps) {
  
  const getStatusColor = (status: DateStatus) => {
    switch (status) {
      case 'active':
        return Colors.light.statusActive;
      case 'new':
        return Colors.light.statusNew;
      case 'fading':
        return Colors.light.statusFading;
      case 'ended':
        return Colors.light.statusEnded;
      case 'ghosted':
        return Colors.light.statusGhosted;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusLabel = (status: DateStatus) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'new':
        return 'New';
      case 'fading':
        return 'Fading';
      case 'ended':
        return 'Ended';
      case 'ghosted':
        return 'Ghosted';
      default:
        return 'Unknown';
    }
  };

  const formatRating = (rating?: number) => {
    return (rating != null && rating > 0) ? `${rating.toFixed(1)}/5` : 'No rating';
  };

  const formatDateCount = (count: number) => {
    return count === 1 ? '1 date' : `${count} dates`;
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
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar
            uri={person.avatar}
            name={person.name}
            size={48}
          />
        </View>

        {/* Person info */}
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {person.name}
            </Text>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(person.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusLabel(person.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.details}>
            {person.lastDate && (
              <Text style={styles.detailText}>
                Last: {person.lastDate} • {formatDateCount(person.totalDates)}
              </Text>
            )}
            
            {person.nextDate ? (
              <Text style={styles.nextDate}>
                📅 Next: {person.nextDate}
              </Text>
            ) : person.averageRating ? (
              <Text style={styles.detailText}>
                Rating: {formatRating(person.averageRating)}
              </Text>
            ) : null}
          </View>
        </View>
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
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  details: {
    gap: 2,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '400',
  },
  nextDate: {
    fontSize: 14,
    color: Colors.light.statusNew,
    fontWeight: '500',
  },
});