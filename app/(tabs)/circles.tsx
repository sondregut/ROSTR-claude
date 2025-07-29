import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { FriendCircleModal } from '@/components/ui/modals/FriendCircleModal';
import { SimpleCircleCard } from '@/components/ui/cards/SimpleCircleCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CircleService } from '@/services/supabase/circles';
import { useAuth } from '@/contexts/SimpleAuthContext';

export default function CirclesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  
  const [circles, setCircles] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load circles from Supabase
  const loadCircles = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user's circles
      const userCircles = await CircleService.getUserCircles(user.id);
      
      // Transform circles data for display
      const transformedCircles = userCircles.map(circle => ({
        id: circle.id,
        name: circle.name,
        description: circle.description,
        memberCount: circle.member_count,
        members: circle.members?.map(m => m.user).filter(Boolean) || [],
        isActive: circle.is_active,
      }));
      
      setCircles(transformedCircles);
      
      // Extract unique friends from all circles
      const allFriends = new Map();
      userCircles.forEach(circle => {
        circle.members?.forEach(member => {
          if (member.user && member.user.id !== user.id) {
            allFriends.set(member.user.id, member.user);
          }
        });
      });
      
      setFriends(Array.from(allFriends.values()));
    } catch (err) {
      console.error('Error loading circles:', err);
      setError('Failed to load circles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCircles();
  }, [user]);
  
  const handleCreateCircle = async (circleName: string, description: string, friendIds: string[]) => {
    if (!user) return;
    
    try {
      // Create the circle
      const newCircle = await CircleService.createCircle(circleName, description, user.id);
      
      // Add friends to the circle if any were selected
      if (friendIds.length > 0) {
        await CircleService.addMembers(newCircle.id, friendIds);
      }
      
      // Refresh circles after creating
      await loadCircles();
      setIsModalVisible(false);
    } catch (err) {
      console.error('Error creating circle:', err);
      setError('Failed to create circle');
    }
  };
  
  const renderCircleItem = ({ item }: { item: any }) => (
    <SimpleCircleCard
      id={item.id}
      name={item.name}
      memberCount={item.memberCount || 0}
      members={item.members || []}
      isActive={item.isActive}
      onPress={() => {
        // Navigate to circle detail
        router.push(`/circles/${item.id}`);
      }}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading circles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Circles</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* My Circles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Circles</Text>
            <Pressable
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createButtonText}>Create</Text>
            </Pressable>
          </View>
          
          {circles.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="people-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No circles yet</Text>
              <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                Create your first circle to start sharing dates with friends
              </Text>
              <Pressable
                style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                onPress={() => setIsModalVisible(true)}
              >
                <Text style={styles.emptyStateButtonText}>Create First Circle</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={circles}
              renderItem={renderCircleItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.circlesList}
            />
          )}
        </View>

        {/* Join Circle Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Join a Circle</Text>
          <Pressable style={[styles.joinCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.joinIconContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="link-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.joinContent}>
              <Text style={[styles.joinTitle, { color: colors.text }]}>Have an invite code?</Text>
              <Text style={[styles.joinSubtitle, { color: colors.secondaryText }]}>
                Join a friend's circle with their code
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Create Circle Modal */}
      <FriendCircleModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreateCircle={handleCreateCircle}
        friends={friends}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingBottom: 100,
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  circlesList: {
    gap: 12,
    paddingHorizontal: 20,
  },
  joinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  joinIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  joinContent: {
    flex: 1,
  },
  joinTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  joinSubtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});