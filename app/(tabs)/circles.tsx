import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Platform, ScrollView, ActivityIndicator, Alert, Share, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { FriendCircleModal } from '@/components/ui/modals/FriendCircleModal';
import { EnhancedContactModal } from '@/components/ui/modals/EnhancedContactModal';
import { UserSearchModal } from '@/components/ui/search/UserSearchModal';
import { CircleInviteModal } from '@/components/ui/modals/CircleInviteModal';
import { SimpleCircleCard } from '@/components/ui/cards/SimpleCircleCard';
import { FriendCard } from '@/components/ui/cards/FriendCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CircleService } from '@/services/supabase/circles';
import { FriendsService, Friend } from '@/services/supabase/friends';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useSafeUser } from '@/hooks/useSafeUser';
import { useCircles } from '@/contexts/CircleContext';

export default function CirclesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const auth = useSafeAuth();
  const user = auth?.user;
  const safeUser = useSafeUser();
  const userProfile = safeUser?.userProfile;
  const { circles, isLoading, error, createCircle, refreshCircles } = useCircles();
  
  const [friends, setFriends] = useState<any[]>([]);
  const [actualFriends, setActualFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<'circles' | 'friends'>('circles');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isCircleInviteModalVisible, setIsCircleInviteModalVisible] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<{ id: string; name: string; joinCode: string } | null>(null);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);
  const friendsLoadedRef = useRef(false);
  const lastCirclesLengthRef = useRef(0);
  
  // Load friends from circles (for circle creation) and actual friends (for All Friends tab)
  useEffect(() => {
    if (!user) {
      setIsLoadingFriends(false);
      return;
    }
    
    const loadAllData = async () => {
      setIsLoadingFriends(true);
      
      try {
        // Load actual friends from friendships table
        const userFriends = await FriendsService.getUserFriends(user.id);
        setActualFriends(userFriends);
        
        // Also maintain circle-based friends for circle creation modal
        if (circles && circles.length > 0) {
          const friendsMap = new Map();
          
          for (const circle of circles) {
            if (circle.members) {
              for (const member of circle.members) {
                if (member.user && member.user.id !== user.id) {
                  const existingFriend = friendsMap.get(member.user.id);
                  if (existingFriend) {
                    existingFriend.circles.push({
                      id: circle.id,
                      name: circle.name
                    });
                  } else {
                    friendsMap.set(member.user.id, {
                      ...member.user,
                      circles: [{
                        id: circle.id,
                        name: circle.name
                      }]
                    });
                  }
                }
              }
            }
          }
          
          setFriends(Array.from(friendsMap.values()));
        } else {
          setFriends([]);
        }
      } catch (err) {
        console.error('Error loading friends:', err);
      } finally {
        setIsLoadingFriends(false);
      }
    };
    
    loadAllData();
  }, [circles, user]);
  
  // Handle screen focus to prevent freezing when navigating back
  useFocusEffect(
    useCallback(() => {
      // Component is focused
      return () => {
        // Component is unfocused - cleanup if needed
      };
    }, [])
  );
  
  const handleCreateCircle = async (circleName: string, description: string, friendIds: string[], groupPhotoUri?: string) => {
    if (!user || isCreatingCircle) return;
    
    setIsCreatingCircle(true);
    
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
      
      // Reset refs to force friend reload when circles update
      friendsLoadedRef.current = false;
      lastCirclesLengthRef.current = 0;
      
      // Wait for context to refresh before navigating
      // This ensures the new circle is available in the navigation target
      await refreshCircles();
      
      // Add a longer delay to ensure all state updates are complete
      setTimeout(() => {
        setIsCreatingCircle(false);
        // Navigate to the newly created circle
        router.push(`/circles/${newCircle.id}`);
      }, 300); // Increased delay
    } catch (err) {
      console.error('Error creating circle:', err);
      Alert.alert('Error', 'Failed to create circle');
      setIsCreatingCircle(false);
    }
  };
  
  const handleInvitePress = (circleId: string, circleName: string, joinCode: string) => {
    setSelectedCircle({ id: circleId, name: circleName, joinCode });
    setIsCircleInviteModalVisible(true);
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
  const getTotalFriendCount = () => actualFriends.length;

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;

    try {
      await FriendsService.removeFriend(user.id, friendId);
      setActualFriends(prev => prev.filter(friend => friend.id !== friendId));
      Alert.alert('Success', 'Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    }
  };

  const handleFriendAdded = () => {
    // Reload actual friends when a new friend is added
    if (user) {
      FriendsService.getUserFriends(user.id)
        .then(userFriends => setActualFriends(userFriends))
        .catch(error => console.error('Error reloading friends:', error));
    }
  };
  
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
      joinCode={item.joinCode}
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
        </View>
        
        <View style={styles.friendDetails}>
          <View style={styles.friendNameRow}>
            <Text style={[styles.friendName, { color: colors.text }]}>{item.name}</Text>
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
            {/* Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                All Friends ({getTotalFriendCount()})
              </Text>
            </View>
            
            {/* Your Friends List - TOP SECTION */}
            <View style={styles.friendsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
                  Your Friends
                </Text>
              </View>
              
              {actualFriends.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <Ionicons name="heart-outline" size={48} color={colors.icon} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No friends yet</Text>
                  <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                    Find friends using the options below
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={actualFriends}
                  renderItem={({ item }) => (
                    <FriendCard
                      friend={item}
                      onRemoveFriend={handleRemoveFriend}
                      showActions={true}
                    />
                  )}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              )}
            </View>

            {/* Find Friends Section - BOTTOM SECTION */}
            <View style={styles.quickActionsContainer}>
              <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
                Find Friends
              </Text>
              <View style={styles.quickActions}>
                <Pressable
                  style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setIsContactModalVisible(true)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickActionTitle, { color: colors.text }]}>Find from Contacts</Text>
                  <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                    Discover friends already on Rostr
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setIsSearchModalVisible(true)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="search" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickActionTitle, { color: colors.text }]}>Search Username</Text>
                  <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                    Find friends by @username
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.quickActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={async () => {
                    const userId = user?.id || '';
                    const userName = userProfile?.name || 'A friend';
                    const referralUrl = `https://rostrdating.com?ref=${userId}&invited_by=${encodeURIComponent(userName)}`;
                    await Share.share({
                      message: `Hey! ${userName} invited you to join RostrDating - track and share your dating journey with friends! ${referralUrl}`,
                      title: 'Share RostrDating',
                    });
                  }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="share-outline" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickActionTitle, { color: colors.text }]}>Share Profile</Text>
                  <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                    Invite friends with your link
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Create Circle Modal */}
      <FriendCircleModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreateCircle={handleCreateCircle}
        friends={actualFriends.map(friend => ({
          id: friend.id,
          name: friend.name,
          username: friend.username,
          avatarUri: friend.image_uri,
          isSelected: false
        }))}
      />

      {/* Enhanced Contact Modal */}
      <EnhancedContactModal
        visible={isContactModalVisible}
        onClose={() => setIsContactModalVisible(false)}
        onInvitesSent={(count) => {
          console.log(`Sent invites to ${count} contacts`);
        }}
        onFriendsAdded={(count) => {
          console.log(`Added ${count} friends`);
          handleFriendAdded();
        }}
      />

      {/* User Search Modal */}
      <UserSearchModal
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onFriendAdded={handleFriendAdded}
      />

      {/* Circle Invite Modal */}
      {selectedCircle && (
        <CircleInviteModal
          visible={isCircleInviteModalVisible}
          onClose={() => {
            setIsCircleInviteModalVisible(false);
            setSelectedCircle(null);
          }}
          circleId={selectedCircle.id}
          circleName={selectedCircle.name}
          joinCode={selectedCircle.joinCode}
          onMembersAdded={(count) => {
            console.log(`Added ${count} members to circle`);
            // Refresh circles to update member counts
            refreshCircles();
          }}
        />
      )}
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  quickActions: {
    marginTop: 16,
    gap: 12,
  },
  quickActionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  circlesList: {
    gap: 12,
    paddingHorizontal: 20,
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