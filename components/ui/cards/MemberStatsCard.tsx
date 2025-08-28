import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : '—';
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.card,
      borderColor: colors.border,
    }]}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalDates}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total{'\n'}Dates</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeDates}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{formatRating(stats.averageRating)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg{'\n'}Rating</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.datesThisMonth}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This{'\n'}Month</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
});