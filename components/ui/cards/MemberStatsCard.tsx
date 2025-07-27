import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface MemberStatsData {
  totalDates: number;
  activeDates: number;
  averageRating: number;
  datesThisMonth: number;
}

interface MemberStatsCardProps {
  stats: MemberStatsData;
}

export function MemberStatsCard({ stats }: MemberStatsCardProps) {
  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : '—';
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalDates}</Text>
          <Text style={styles.statLabel}>Total{'\n'}Dates</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.activeDates}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatRating(stats.averageRating)}</Text>
          <Text style={styles.statLabel}>Avg{'\n'}Rating</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.datesThisMonth}</Text>
          <Text style={styles.statLabel}>This{'\n'}Month</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});