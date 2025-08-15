import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Platform, ScrollView, ActivityIndicator, Alert, Share, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { FriendCircleModal } from '@/components/ui/modals/FriendCircleModal';
import { ContactImportModal } from '@/components/ui/modals/ContactImportModal';
import { SimpleCircleCard } from '@/components/ui/cards/SimpleCircleCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CircleService } from '@/services/supabase/circles';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useCircles } from '@/contexts/CircleContext';

export default function CirclesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const auth = useSafeAuth();
  const user = auth?.user;
  const { circles, isLoading, error, createCircle, refreshCircles } = useCircles();
  
  const [friends, setFriends] = useState<any[]>([]);
  const [allFriends, setAllFriends] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'circles' | 'friends'>('circles');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  
  // Load friends from circles
  const loadFriends = useCallback(() => {
    if (!user || !circles || circles.length === 0) return;
    
    setIsLoadingFriends(true);
    
    try {
      // Extract unique friends from all circles with enhanced data structure
      const friendsMap = new Map();
      circles.forEach(circle => {
        circle.members?.forEach((member: any) => {
          if (member.user && member.user.id !== user.id) {
            const existingFriend = friendsMap.get(member.user.id);
            if (existingFriend) {
              // Add this circle to the friend's circles array
              existingFriend.circles.push({
                id: circle.id,
                name: circle.name
              });
            } else {
              // Create new friend entry
              friendsMap.set(member.user.id, {
                ...member.user,
                circles: [{
                  id: circle.id,
                  name: circle.name
                }],
                isOnline: Math.random() > 0.7, // Mock online status - replace with real data
                lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString() // Mock last seen
              });
            }
          }
        });
      });
      
      const allFriendsArray = Array.from(friendsMap.values());
      setFriends(Array.from(friendsMap.values())); // For circle creation modal
      setAllFriends(allFriendsArray); // For All Friends tab
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [circles, user]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);
  
  const handleCreateCircle = async (circleName: string, description: string, friendIds: string[], groupPhotoUri?: string) => {
    if (!user) return;
    
    try {
      // Use the context's createCircle method which will automatically refresh the circles
      const newCircle = await createCircle({
        name: circleName,
        description: description,
        isPrivate: false,
        groupPhotoUrl: groupPhotoUri
      });
      
      // Add friends to the circle if any were selected
      if (friendIds.length > 0) {
        await CircleService.addMembers(newCircle.id, friendIds);
      }
      
      setIsModalVisible(false);
    } catch (err) {
      console.error('Error creating circle:', err);
      Alert.alert('Error', 'Failed to create circle');
    }
  };
  
  const handleInvitePress = async (circleId: string, circleName: string, joinCode: string) => {
    try {
      const inviteMessage = `Join my "${circleName}" circle on RostrDating!\n\nUse code: ${joinCode}`;
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Use native share functionality
        await Share.share({
          message: inviteMessage,
          title: `Join ${circleName}`,
        });
      } else {
        // For web/desktop, copy to clipboard or show alert
        Alert.alert(
          'Circle Invite',
          `Share this invite code with friends:\n\n${joinCode}`,
          [
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error sharing invite:', error);
      // Fallback to showing the join code
      Alert.alert(
        'Circle Invite',
        `Share this invite code with friends:\n\n${joinCode}`,
        [
          { text: 'OK' }
        ]
      );
    }
  };

  // Transform circles for display
  const transformedCircles = circles.map(circle => ({
    id: circle.id,
    name: circle.name,
    description: circle.description,
    memberCount: circle.member_count,
    members: circle.members?.map((m: any) => m.user).filter(Boolean) || [],
    isActive: circle.is_active,
    groupPhotoUri: circle.group_photo_url,
    joinCode: circle.join_code,
  }));

  // Helper functions for friend statistics
  const getTotalFriendCount = () => allFriends.length;
  
  const getOnlineFriendCount = () => allFriends.filter(friend => friend.isOnline).length;
  
  const estimateTotalReach = () => {
    const totalMembers = circles.reduce((sum, circle) => sum + (circle.member_count || 0), 0);
    // Estimate 30% overlap between circles
    const estimatedOverlap = Math.floor(totalMembers * 0.3);
    return Math.max(totalMembers - estimatedOverlap, allFriends.length);
  };

  const renderCircleItem = ({ item }: { item: any }) => (
    <SimpleCircleCard
      id={item.id}
      name={item.name}
      memberCount={item.memberCount || 0}
      members={item.members || []}
      isActive={item.isActive}
      groupPhotoUri={item.groupPhotoUri}
      onPress={() => {
        // Navigate to circle detail
        router.push(`/circles/${item.id}`);
      }}
      onInvitePress={() => handleInvitePress(item.id, item.name, item.joinCode)}
    />
  );

  const renderFriendItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        // Navigate to friend's profile
        router.push(`/profile/${item.username}`);
      }}
    >
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatarContainer}>
          {item.image_uri ? (
            <Image source={{ uri: item.image_uri }} style={styles.friendAvatar} />
          ) : (
            <View style={[styles.friendAvatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.friendAvatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />}
        </View>
        
        <View style={styles.friendDetails}>
          <View style={styles.friendNameRow}>
            <Text style={[styles.friendName, { color: colors.text }]}>{item.name}</Text>
            {item.isOnline && (
              <View style={[styles.onlineBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                <Text style={[styles.onlineBadgeText, { color: '#4CAF50' }]}>Online</Text>
              </View>
            )}
          </View>
          <Text style={[styles.friendUsername, { color: colors.textSecondary }]}>
            @{item.username}
          </Text>
          <View style={styles.friendCircles}>
            {item.circles.slice(0, 2).map((circle: any, index: number) => (
              <View key={circle.id} style={[styles.circleChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.circleChipText, { color: colors.primary }]}>
                  {circle.name}
                </Text>
              </View>
            ))}
            {item.circles.length > 2 && (
              <Text style={[styles.moreCircles, { color: colors.textSecondary }]}>
                +{item.circles.length - 2} more
              </Text>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.friendActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            // Handle message action
            console.log('Message friend:', item.name);
          }}
        >
          <Ionicons name="chatbubble-outline" size={16} color="white" />
        </Pressable>
      </View>
    </Pressable>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {activeTab === 'circles' ? 'My Circles' : 'All Friends'}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'circles' && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('circles')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'circles' ? colors.primary : colors.textSecondary }
          ]}>
            My Circles
          </Text>
        </Pressable>
        
        <Pressable
          style={[
            styles.tab,
            activeTab === 'friends' && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'friends' ? colors.primary : colors.textSecondary }
          ]}>
            All Friends
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'circles' ? (
          /* My Circles Tab Content */
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
            
            {transformedCircles.length === 0 ? (
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
                data={transformedCircles}
                renderItem={renderCircleItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.circlesList}
              />
            )}
          </View>
        ) : (
          /* All Friends Tab Content */
          <View style={styles.section}>
            {/* Friends List */}
            <View style={styles.friendsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  All Friends ({getTotalFriendCount()})
                </Text>
                <Pressable
                  style={[styles.importButton, { backgroundColor: colors.primary }]}
                  onPress={() => setIsContactModalVisible(true)}
                >
                  <Ionicons name="person-add" size={16} color="white" />
                  <Text style={styles.importButtonText}>Import</Text>
                </Pressable>
              </View>
              
              {allFriends.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Ionicons name="person-outline" size={48} color={colors.icon} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No friends yet</Text>
                  <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                    Create circles and add friends to start building your network
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={allFriends}
                  renderItem={renderFriendItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>
        )}

        {/* Join Circle Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Join a Circle</Text>
          </View>
          <Pressable style={[styles.joinCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.joinIconContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="link-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.joinContent}>
              <Text style={[styles.joinTitle, { color: colors.text }]}>Have an invite code?</Text>
              <Text style={[styles.joinSubtitle, { color: colors.textSecondary }]}>
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

      {/* Contact Import Modal */}
      <ContactImportModal
        visible={isContactModalVisible}
        onClose={() => setIsContactModalVisible(false)}
        onInvitesSent={(count) => {
          console.log(`Sent invites to ${count} contacts`);
          // Optionally refresh friends list or show a success message
        }}
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
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  importButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  friendsSection: {
    marginTop: 8,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  friendDetails: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  onlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  onlineBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  friendUsername: {
    fontSize: 14,
    marginBottom: 8,
  },
  friendCircles: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  circleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  circleChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreCircles: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});