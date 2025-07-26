import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  useColorScheme,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { DateCard } from '@/components/ui/cards/DateCard';

// Mock data - in real app, this would come from database
const MOCK_CIRCLE_DATA = {
  '1': {
    name: 'Close Friends',
    description: 'My inner circle for honest feedback',
    createdAt: '2024-01-01',
    isActive: true,
    members: [
      { id: '1', name: 'Sarah Johnson', username: 'sarahj', avatarUri: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { id: '2', name: 'Emma Wilson', username: 'emmaw', avatarUri: 'https://randomuser.me/api/portraits/women/22.jpg' },
    ],
    recentUpdates: [
      {
        id: '1',
        personName: 'Alex',
        date: '2 hours ago',
        location: 'Coffee Shop',
        rating: 4.5,
        notes: 'Great conversation over coffee. Talked about travel plans.',
        tags: ['First Date', 'Chemistry'],
        author: 'Sarah Johnson',
        authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      {
        id: '2',
        personName: 'Jordan',
        date: '1 day ago',
        location: 'Italian Restaurant',
        rating: 3.5,
        notes: 'Nice dinner but conversation felt a bit forced at times.',
        tags: ['Second Date', 'Awkward'],
        author: 'Emma Wilson',
        authorAvatar: 'https://randomuser.me/api/portraits/women/22.jpg',
      },
    ],
    stats: {
      totalUpdates: 45,
      thisMonth: 12,
      averageRating: 3.8,
    },
  },
};

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isActive, setIsActive] = useState(true);
  const [activeTab, setActiveTab] = useState<'updates' | 'members'>('updates');
  
  // Get circle data - in real app, this would be fetched from database
  const circleData = MOCK_CIRCLE_DATA[id as keyof typeof MOCK_CIRCLE_DATA] || MOCK_CIRCLE_DATA['1'];
  
  const renderUpdate = ({ item }: { item: typeof circleData.recentUpdates[0] }) => (
    <View style={styles.updateCard}>
      <View style={styles.updateAuthor}>
        <Image source={{ uri: item.authorAvatar }} style={styles.authorAvatar} />
        <Text style={[styles.authorName, { color: colors.text }]}>{item.author}</Text>
        <Text style={[styles.updateTime, { color: colors.textSecondary }]}>• {item.date}</Text>
      </View>
      <DateCard
        id={item.id}
        personName={item.personName}
        date={item.date}
        location={item.location}
        rating={item.rating}
        notes={item.notes}
        tags={item.tags}
        likeCount={0}
        commentCount={0}
        isLiked={false}
        onPress={() => {}}
        onLike={() => {}}
        onComment={() => {}}
      />
    </View>
  );
  
  const renderMember = ({ item }: { item: typeof circleData.members[0] }) => (
    <Pressable
      style={[styles.memberItem, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/profile/${item.username}`)}
    >
      <Image source={{ uri: item.avatarUri }} style={styles.memberAvatar} />
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.memberUsername, { color: colors.textSecondary }]}>@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          
          <View style={styles.headerContent}>
            <Text style={[styles.circleName, { color: colors.text }]}>{circleData.name}</Text>
            <Text style={[styles.circleDescription, { color: colors.textSecondary }]}>
              {circleData.description}
            </Text>
            
            <View style={styles.circleInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={20} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {circleData.members.length} members
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Created {new Date(circleData.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{circleData.stats.totalUpdates}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Updates</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{circleData.stats.thisMonth}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Month</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{circleData.stats.averageRating}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
          </View>
        </View>
        
        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Active Circle</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            When inactive, you won't receive updates from this circle
          </Text>
        </View>
        
        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.tab, activeTab === 'updates' && styles.activeTab]}
            onPress={() => setActiveTab('updates')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'updates' ? colors.primary : colors.textSecondary }
            ]}>
              Recent Updates
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'members' ? colors.primary : colors.textSecondary }
            ]}>
              Members ({circleData.members.length})
            </Text>
          </Pressable>
        </View>
        
        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'updates' ? (
            <FlatList
              data={circleData.recentUpdates}
              renderItem={renderUpdate}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No recent updates from this circle
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={circleData.members}
              renderItem={renderMember}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListFooterComponent={
                <Button
                  title="Add Members"
                  variant="outline"
                  onPress={() => console.log('Add members')}
                  style={styles.addMembersButton}
                  leftIcon={<Ionicons name="person-add-outline" size={20} color={colors.primary} />}
                />
              }
            />
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Edit Circle"
            variant="outline"
            onPress={() => console.log('Edit circle')}
            style={styles.actionButton}
          />
          <Button
            title="Leave Circle"
            variant="outline"
            onPress={() => console.log('Leave circle')}
            style={[styles.actionButton, { borderColor: 'red' }]}
            textStyle={{ color: 'red' }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {
    gap: 8,
  },
  circleName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  circleDescription: {
    fontSize: 16,
  },
  circleInfo: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  settingsCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(240, 122, 122, 0.1)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  updateCard: {
    marginBottom: 16,
  },
  updateAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  updateTime: {
    fontSize: 14,
    marginLeft: 4,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  addMembersButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});