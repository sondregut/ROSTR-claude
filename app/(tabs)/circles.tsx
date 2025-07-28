import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { FriendCircleModal } from '@/components/ui/modals/FriendCircleModal';
import { SimpleCircleCard } from '@/components/ui/cards/SimpleCircleCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock data for demonstration - matching the specification
const MOCK_FRIENDS = [
  {
    id: '1',
    name: 'Sarah Chen',
    username: 'sarahc',
    avatarUri: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: '2',
    name: 'Mike Johnson',
    username: 'mikej',
    avatarUri: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: '3',
    name: 'Emma Wilson',
    username: 'emmaw',
    avatarUri: 'https://randomuser.me/api/portraits/women/22.jpg',
  },
  {
    id: '4',
    name: 'Jason Martinez',
    username: 'jasonm',
    avatarUri: 'https://randomuser.me/api/portraits/men/11.jpg',
  },
  {
    id: '5',
    name: 'Alex Rodriguez',
    username: 'alexr',
    avatarUri: 'https://randomuser.me/api/portraits/men/43.jpg',
  },
  {
    id: '6',
    name: 'Taylor Kim',
    username: 'taylork',
    avatarUri: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: '7',
    name: 'Jordan Lee',
    username: 'jordanl',
    avatarUri: 'https://randomuser.me/api/portraits/men/15.jpg',
  },
  {
    id: '8',
    name: 'Casey Brown',
    username: 'caseyb',
    avatarUri: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
];

const MOCK_CIRCLES = [
  {
    id: '1',
    name: 'Besties',
    description: 'My closest friends who know everything about my dating life',
    friends: [MOCK_FRIENDS[0], MOCK_FRIENDS[1], MOCK_FRIENDS[2], MOCK_FRIENDS[3], MOCK_FRIENDS[4]],
    lastActivity: '2 hours ago',
    isActive: true,
  },
  {
    id: '2',
    name: 'Roommates',
    description: 'Living together, dating separately',
    friends: [MOCK_FRIENDS[0], MOCK_FRIENDS[2], MOCK_FRIENDS[5]],
    lastActivity: '1 day ago',
    isActive: false,
  },
  {
    id: '3',
    name: 'College Crew',
    description: 'Old friends from university days',
    friends: [MOCK_FRIENDS[0], MOCK_FRIENDS[1], MOCK_FRIENDS[2], MOCK_FRIENDS[3], MOCK_FRIENDS[4], MOCK_FRIENDS[5], MOCK_FRIENDS[6], MOCK_FRIENDS[7]],
    lastActivity: '1 week ago',
    isActive: false,
  },
];

export default function CirclesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [circles, setCircles] = useState(MOCK_CIRCLES);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const handleCreateCircle = (circleName: string, description: string, friendIds: string[]) => {
    const newCircle = {
      id: `circle-${Date.now()}`,
      name: circleName,
      description: description,
      friends: MOCK_FRIENDS.filter(friend => friendIds.includes(friend.id)),
      lastActivity: 'Just now',
      isActive: true,
    };
    
    setCircles([...circles, newCircle]);
    setIsModalVisible(false);
  };

  
  const renderCircleItem = ({ item }: { item: typeof MOCK_CIRCLES[0] }) => (
    <SimpleCircleCard
      id={item.id}
      name={item.name}
      memberCount={item.friends.length}
      members={item.friends}
      isActive={item.isActive}
      onPress={() => {
        // Navigate to circle detail
        router.push(`/circles/${item.id}`);
      }}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Circles</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Circles</Text>
            <Pressable
              style={[styles.createButton, { borderColor: colors.border }]}
              onPress={() => setIsModalVisible(true)}
            >
              <Ionicons name="add" size={18} color={colors.text} />
              <Text style={[styles.createButtonText, { color: colors.text }]}>Create</Text>
            </Pressable>
          </View>

          {circles.length > 0 ? (
            <View style={styles.circlesList}>
              {circles.map((item) => (
                <SimpleCircleCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  memberCount={item.friends.length}
                  members={item.friends}
                  isActive={item.isActive}
                  onPress={() => {
                    router.push(`/circles/${item.id}`);
                  }}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No circles yet. Create one to start sharing!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Invites</Text>
          <View style={[styles.invitesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.invitesText, { color: colors.textSecondary }]}>
              No pending invites
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <FriendCircleModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreateCircle={handleCreateCircle}
        friends={MOCK_FRIENDS}
        existingCircles={circles}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  circlesList: {
    marginBottom: 8,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  invitesCard: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
  },
  invitesText: {
    fontSize: 16,
  },
});
