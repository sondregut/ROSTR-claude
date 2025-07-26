import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, useColorScheme, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { FriendCircleModal } from '@/components/ui/modals/FriendCircleModal';
import { CircleCard } from '@/components/ui/cards/CircleCard';
import { Colors } from '@/constants/Colors';

// Mock data for demonstration
const MOCK_FRIENDS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    username: 'sarahj',
    avatarUri: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: '2',
    name: 'Michael Chen',
    username: 'mikechen',
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
    name: 'David Kim',
    username: 'davidk',
    avatarUri: 'https://randomuser.me/api/portraits/men/11.jpg',
  },
];

const MOCK_CIRCLES = [
  {
    id: '1',
    name: 'Close Friends',
    description: 'My inner circle for honest feedback',
    friends: [MOCK_FRIENDS[0], MOCK_FRIENDS[2]],
    lastActivity: '2 hours ago',
    isActive: true,
  },
  {
    id: '2',
    name: 'Dating Advisors',
    description: 'Friends who give the best dating advice',
    friends: [MOCK_FRIENDS[1], MOCK_FRIENDS[3], MOCK_FRIENDS[0]],
    lastActivity: '1 day ago',
    isActive: true,
  },
  {
    id: '3',
    name: 'College Squad',
    description: 'Old friends from university days',
    friends: [MOCK_FRIENDS[0], MOCK_FRIENDS[1], MOCK_FRIENDS[2], MOCK_FRIENDS[3]],
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
  
  const handleCreateCircle = (circleName: string, friendIds: string[]) => {
    const newCircle = {
      id: `circle-${Date.now()}`,
      name: circleName,
      description: '',
      friends: MOCK_FRIENDS.filter(friend => friendIds.includes(friend.id)),
      lastActivity: 'Just now',
      isActive: true,
    };
    
    setCircles([...circles, newCircle]);
    setIsModalVisible(false);
  };
  
  const renderCircleItem = ({ item }: { item: typeof MOCK_CIRCLES[0] }) => (
    <CircleCard
      id={item.id}
      name={item.name}
      description={item.description}
      memberCount={item.friends.length}
      members={item.friends}
      lastActivity={item.lastActivity}
      isActive={item.isActive}
      onPress={() => {
        // Navigate to circle detail
        router.push(`/circles/${item.id}`);
      }}
      onOptionsPress={() => {
        console.log('Circle options for', item.id);
      }}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {circles.length > 0 ? (
        <>
          <FlatList
            data={circles}
            renderItem={renderCircleItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Circles</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Share your dating updates with trusted friends
                </Text>
              </View>
            }
          />
          
          <Pressable
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setIsModalVisible(true)}
          >
            <Ionicons name="add" size={28} color="white" />
          </Pressable>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No friend circles yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Create circles to share your dating journey with trusted friends
          </Text>
          <Pressable
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.createButtonText}>Create Your First Circle</Text>
          </Pressable>
        </View>
      )}
      
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  listHeader: {
    marginBottom: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
