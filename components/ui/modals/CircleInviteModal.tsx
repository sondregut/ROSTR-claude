import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { supabase } from '@/lib/supabase';
import { CircleService } from '@/services/supabase/circles';
import { UserSearchService } from '@/services/UserSearchService';
import { ContactSyncService } from '@/services/contacts/ContactSyncService';

interface Friend {
  id: string;
  name: string;
  username: string;
  image_uri?: string;
  isMember?: boolean;
}

interface CircleInviteModalProps {
  visible: boolean;
  onClose: () => void;
  circleId: string;
  circleName: string;
  joinCode: string;
  onMembersAdded?: (count: number) => void;
}

type ActiveSection = 'friends' | 'discover' | 'share';

export function CircleInviteModal({
  visible,
  onClose,
  circleId,
  circleName,
  joinCode,
  onMembersAdded
}: CircleInviteModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const auth = useSafeAuth();
  const user = auth?.user;

  const [activeSection, setActiveSection] = useState<ActiveSection>('friends');
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [totalFriendsCount, setTotalFriendsCount] = useState(0);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadInviteableFriends();
    } else {
      resetState();
    }
  }, [visible, user]);

  const resetState = () => {
    setActiveSection('friends');
    setFriends([]);
    setTotalFriendsCount(0);
    setSelectedFriends(new Set());
    setSearchQuery('');
    setIsProcessing(false);
    setShowQR(false);
  };

  const loadInviteableFriends = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get user's friends who aren't already in this circle
      const { data: userFriends, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          friend_id,
          friend:users!friendships_friend_id_fkey (
            id,
            name,
            username,
            image_uri
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (friendsError) throw friendsError;

      // Get current circle members to exclude them
      const { data: circleMembers } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId);

      const memberIds = new Set(circleMembers?.map(m => m.user_id) || []);

      // Track total friends count
      setTotalFriendsCount(userFriends?.length || 0);

      // Filter out friends who are already members
      const inviteableFriends = (userFriends || [])
        .filter(f => f.friend && !memberIds.has(f.friend_id))
        .map(f => ({
          id: f.friend_id,
          name: f.friend.name,
          username: f.friend.username,
          image_uri: f.friend.image_uri,
          isMember: false
        }));

      setFriends(inviteableFriends);
    } catch (error) {
      console.error('Error loading inviteable friends:', error);
      Alert.alert(
        'Loading Error', 
        'Unable to load your friends list. Please check your connection and try again.',
        [
          { text: 'OK', onPress: () => onClose() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const selectAllFriends = () => {
    const allFriendIds = friends.map(f => f.id);
    setSelectedFriends(new Set(allFriendIds));
  };

  const clearSelection = () => {
    setSelectedFriends(new Set());
  };

  const addSelectedFriends = async () => {
    if (selectedFriends.size === 0) {
      Alert.alert('No Selection', 'Please select friends to add to the circle.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Add selected friends to circle
      await CircleService.addMembers(circleId, Array.from(selectedFriends));
      
      // Notify parent component
      onMembersAdded?.(selectedFriends.size);
      
      Alert.alert(
        'Success!', 
        `Added ${selectedFriends.size} friend${selectedFriends.size === 1 ? '' : 's'} to "${circleName}"`
      );
      
      // Refresh the friends list and clear selection
      await loadInviteableFriends();
      setSelectedFriends(new Set());
      
    } catch (error) {
      console.error('Error adding friends to circle:', error);
      const errorMessage = error.message?.includes('permission') 
        ? 'You don\'t have permission to add members to this circle.'
        : error.message?.includes('already members')
        ? 'Some selected friends are already members of this circle.'
        : 'Failed to add friends to circle. Please check your connection and try again.';
        
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareInvite = async () => {
    try {
      const userId = user?.id || '';
      const userName = user?.name || 'Friend';
      const inviteUrl = `https://rostrdating.com?ref=${userId}&invited_by=${encodeURIComponent(userName)}&circle=${circleId}`;
      const message = `🎉 Join my "${circleName}" circle on RostrDating!\n\n` +
                     `Use invite code: ${joinCode}\n` +
                     `Or visit: ${inviteUrl}`;

      await Share.share({
        message,
        title: `Join ${circleName}`,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const openContactSync = () => {
    Alert.alert(
      'Find from Contacts', 
      'This feature helps you discover friends from your phone contacts who are already on RostrDating.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => console.log('Contact sync would open here') }
      ]
    );
  };

  const openUserSearch = () => {
    Alert.alert(
      'Search by Username',
      'Enter a username to find and add friends directly to this circle.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => console.log('User search would open here') }
      ]
    );
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriend = ({ item }: { item: Friend }) => (
    <Pressable
      style={[
        styles.friendItem,
        { 
          backgroundColor: selectedFriends.has(item.id) ? colors.primary + '15' : colors.background,
          borderColor: selectedFriends.has(item.id) ? colors.primary : colors.border
        }
      ]}
      onPress={() => toggleFriendSelection(item.id)}
    >
      <View style={styles.friendInfo}>
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={styles.friendAvatar} />
        ) : (
          <View style={[styles.friendAvatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.friendAvatarText, { color: colors.primary }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.friendDetails}>
          <Text style={[styles.friendName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.friendUsername, { color: colors.textSecondary }]}>@{item.username}</Text>
        </View>
      </View>
      
      <View style={[
        styles.checkbox,
        { 
          backgroundColor: selectedFriends.has(item.id) ? colors.primary : 'transparent',
          borderColor: colors.primary
        }
      ]}>
        {selectedFriends.has(item.id) && (
          <Ionicons name="checkmark" size={16} color="white" />
        )}
      </View>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add to {circleName}</Text>
          
          {activeSection === 'friends' && selectedFriends.size > 0 && (
            <Pressable 
              onPress={addSelectedFriends}
              style={[styles.headerButton, { opacity: isProcessing ? 0.5 : 1 }]}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.addText, { color: colors.primary }]}>
                  Add ({selectedFriends.size})
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Section Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          <Pressable
            style={[
              styles.tab,
              activeSection === 'friends' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveSection('friends')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeSection === 'friends' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeSection === 'friends' ? colors.primary : colors.textSecondary }
            ]}>
              Friends
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.tab,
              activeSection === 'discover' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveSection('discover')}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color={activeSection === 'discover' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeSection === 'discover' ? colors.primary : colors.textSecondary }
            ]}>
              Discover
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.tab,
              activeSection === 'share' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveSection('share')}
          >
            <Ionicons 
              name="share-outline" 
              size={20} 
              color={activeSection === 'share' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeSection === 'share' ? colors.primary : colors.textSecondary }
            ]}>
              Share
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeSection === 'friends' && (
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading your friends...
                </Text>
              </View>
            ) : filteredFriends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {totalFriendsCount === 0 
                    ? 'No Friends Yet' 
                    : friends.length === 0 
                    ? 'All Friends Already Added'
                    : 'No Matches Found'
                  }
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {totalFriendsCount === 0 
                    ? "You don't have any friends on RostrDating yet. Let's find some!" 
                    : friends.length === 0 
                    ? 'All your friends are already members of this circle!'
                    : 'Try a different search term'
                  }
                </Text>
                {totalFriendsCount === 0 && (
                  <Pressable 
                    style={[styles.discoverButton, { backgroundColor: colors.primary }]}
                    onPress={() => setActiveSection('discover')}
                  >
                    <Ionicons name="search" size={20} color="white" />
                    <Text style={styles.discoverButtonText}>Discover Friends</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredFriends}
                renderItem={renderFriend}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                  <View style={styles.section}>
                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                      <Ionicons name="search" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search your friends..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>

                    {/* Selection Controls */}
                    {filteredFriends.length > 0 && (
                      <View style={styles.selectionControls}>
                        <Pressable onPress={selectAllFriends} style={styles.selectionButton}>
                          <Text style={[styles.selectionButtonText, { color: colors.primary }]}>
                            Select All ({filteredFriends.length})
                          </Text>
                        </Pressable>
                        {selectedFriends.size > 0 && (
                          <Pressable onPress={clearSelection} style={styles.selectionButton}>
                            <Text style={[styles.selectionButtonText, { color: colors.textSecondary }]}>
                              Clear
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                )}
                contentContainerStyle={styles.friendsListContainer}
              />
            )
          )}

          {activeSection === 'discover' && (
            <ScrollView style={styles.section} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Find More Friends
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Discover new friends and add them to your circle
              </Text>

              <View style={styles.discoverActions}>
                <Pressable
                  style={[styles.discoverCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={openContactSync}
                >
                  <View style={[styles.discoverIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.discoverContent}>
                    <Text style={[styles.discoverTitle, { color: colors.text }]}>Find from Contacts</Text>
                    <Text style={[styles.discoverSubtitle, { color: colors.textSecondary }]}>
                      Discover friends from your phone contacts
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </Pressable>

                <Pressable
                  style={[styles.discoverCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={openUserSearch}
                >
                  <View style={[styles.discoverIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="search" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.discoverContent}>
                    <Text style={[styles.discoverTitle, { color: colors.text }]}>Search Username</Text>
                    <Text style={[styles.discoverSubtitle, { color: colors.textSecondary }]}>
                      Find friends by their @username
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={[styles.tip, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  Tip: New friends you discover will become available to add to any of your circles.
                </Text>
              </View>
            </ScrollView>
          )}

          {activeSection === 'share' && (
            <ScrollView style={styles.section} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Share Circle Invite
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Share this circle with people who aren't on RostrDating yet
              </Text>

              {/* Join Code Display */}
              <View style={[styles.joinCodeContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.joinCodeHeader}>
                  <Text style={[styles.joinCodeLabel, { color: colors.textSecondary }]}>Invite Code</Text>
                  <Pressable style={[styles.qrButton, { backgroundColor: colors.primary + '20' }]} onPress={() => setShowQR(!showQR)}>
                    <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
                    <Text style={[styles.qrButtonText, { color: colors.primary }]}>QR</Text>
                  </Pressable>
                </View>
                <Text style={[styles.joinCode, { color: colors.text }]}>{joinCode}</Text>
              </View>

              {/* QR Code */}
              {showQR && (
                <View style={[styles.qrContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <QRCode
                    value={`https://rostrdating.com?ref=${user?.id}&invited_by=${encodeURIComponent(user?.name || 'Friend')}&circle=${circleId}`}
                    size={200}
                    backgroundColor={colors.card}
                    color={colors.text}
                  />
                  <Text style={[styles.qrLabel, { color: colors.textSecondary }]}>
                    Scan to join "{circleName}"
                  </Text>
                </View>
              )}

              {/* Share Actions */}
              <View style={styles.shareActions}>
                <Pressable
                  style={[styles.shareButton, { backgroundColor: colors.primary }]}
                  onPress={handleShareInvite}
                >
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.shareButtonText}>Share Invite</Text>
                </Pressable>
              </View>

              <View style={[styles.tip, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  Share this code with friends who don't have RostrDating yet. They can use it to join after downloading the app.
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  cancelText: {
    fontSize: 16,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectionButton: {
    paddingVertical: 4,
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  friendsListContainer: {
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendDetails: {
    marginLeft: 12,
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  friendUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  discoverActions: {
    gap: 12,
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  discoverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverContent: {
    flex: 1,
    marginLeft: 12,
  },
  discoverTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  discoverSubtitle: {
    fontSize: 14,
  },
  joinCodeContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  joinCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  joinCodeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  qrButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  joinCode: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  shareActions: {
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tip: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});