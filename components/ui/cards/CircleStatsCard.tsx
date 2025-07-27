import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { MemberData } from './MemberCard';
import { Avatar } from '../Avatar';

interface CircleStatsData {
  postsThisMonth: number;
  onlineMembers: number;
  totalMembers: number;
  mostActiveMembers: {
    member: MemberData;
    interactions: number;
  }[];
}

interface CircleStatsCardProps {
  stats: CircleStatsData;
}

export function CircleStatsCard({ stats }: CircleStatsCardProps) {
  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Stats */}
      <View style={styles.mainStats}>
        <Text style={styles.sectionTitle}>Circle Stats</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.postsThisMonth}</Text>
            <Text style={styles.statLabel}>Posts this{'\n'}month</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.onlineMembers}</Text>
            <Text style={styles.statLabel}>Online now</Text>
          </View>
        </View>
      </View>

      {/* Most Active Members */}
      {stats.mostActiveMembers.length > 0 && (
        <View style={styles.activeMembers}>
          <Text style={styles.sectionTitle}>Most Active Members</Text>
          
          {stats.mostActiveMembers.slice(0, 3).map((item, index) => (
            <View key={item.member.id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.medal}>{getMedalEmoji(index)}</Text>
                <Avatar
                  uri={item.member.avatar}
                  name={item.member.name}
                  size={32}
                />
                <Text style={styles.memberName} numberOfLines={1}>
                  {item.member.name}
                </Text>
              </View>
              
              <Text style={styles.interactionCount}>
                {item.interactions} interactions
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  mainStats: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  activeMembers: {
    padding: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medal: {
    fontSize: 16,
    marginRight: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  interactionCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
});