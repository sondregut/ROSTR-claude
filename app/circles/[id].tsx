import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { DateCard } from '@/components/ui/cards/DateCard';
import { CommentModal } from '@/components/ui/modals/CommentModal';
import { MemberCard, type MemberData, type MemberRole, type OnlineStatus } from '@/components/ui/cards/MemberCard';
import { CircleStatsCard } from '@/components/ui/cards/CircleStatsCard';
import { CircleChat } from '@/components/ui/chat/CircleChat';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getCurrentUser } from '@/lib/supabase';
import { useCirclePermissions } from '@/hooks/useCirclePermissions';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useCircles } from '@/contexts/CircleContext';
import { shareCircleInvite } from '@/lib/inviteUtils';
import { useUser } from '@/contexts/UserContext';


export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { userProfile } = useUser();
  const permissions = useCirclePermissions(id as string);
  const { currentCircle, loadCircle, isLoading, error } = useCircles();
  
  const [isActive, setIsActive] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'chat' | 'members' | 'insights'>('activity');
  const [updates, setUpdates] = useState([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Load circle data when component mounts
  useEffect(() => {
    if (id) {
      loadCircle(id as string);
    }
  }, [id]);
  
  // Update local state when circle data changes
  useEffect(() => {
    if (currentCircle) {
      setUpdates(currentCircle.recentUpdates || []);
      setIsActive(currentCircle.is_active);
    }
  }, [currentCircle]);
  
  // Get current user from auth context
  const currentUser = {
    id: user?.id || '',
    name: user?.user_metadata?.full_name || user?.email || 'User',
    avatar: user?.user_metadata?.avatar_url || ''
  };
  
  // Show loading state
  if (isLoading || !currentCircle) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading circle...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Error Loading Circle</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{error}</Text>
          <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }
  
  const handleLike = (updateId: string) => {
    setUpdates(updates.map(update => 
      update.id === updateId 
        ? { 
            ...update, 
            isLiked: !update.isLiked,
            likeCount: update.isLiked ? update.likeCount - 1 : update.likeCount + 1
          }
        : update
    ));
  };
  
  const handleComment = (updateId: string) => {
    setSelectedUpdateId(updateId);
    setCommentModalVisible(true);
  };
  
  const handleSubmitComment = (text: string) => {
    if (!selectedUpdateId) return;
    
    setUpdates(updates.map(update => 
      update.id === selectedUpdateId
        ? {
            ...update,
            comments: [
              ...(update.comments || []),
              { name: userProfile?.name || 'You', content: text }
            ],
            commentCount: update.commentCount + 1
          }
        : update
    ));
  };
  
  const renderUpdate = ({ item }: { item: typeof updates[0] }) => (
    <DateCard
      id={item.id}
      personName={item.personName}
      date={item.date}
      location={item.location}
      rating={item.rating}
      notes={item.notes}
      tags={item.tags}
      instagramUsername={item.instagramUsername}
      authorName={item.author}
      authorAvatar={item.authorAvatar}
      poll={item.poll ? {
        question: item.poll.question,
        options: item.poll.options.map(option => ({
          text: option.text,
          votes: option.votes
        }))
      } : undefined}
      comments={item.comments}
      likeCount={item.likeCount}
      commentCount={item.commentCount}
      isLiked={item.isLiked}
      onLike={() => handleLike(item.id)}
      onComment={() => handleComment(item.id)}
      onPersonHistoryPress={() => router.push(`/person/${item.personName.toLowerCase()}?friendUsername=${item.author.toLowerCase().replace(' ', '')}&isOwnRoster=false`)}
      onAuthorPress={() => {
        // Navigate to the friend's profile who posted the update
        const member = currentCircle.members.find(m => m.user?.name === item.author);
        if (member && member.user) {
          router.push(`/profile/${member.user.username}`);
        }
      }}
    />
  );
  
  const renderMember = ({ item }: { item: any }) => {
    // Transform database member data to MemberCard format
    const memberData: MemberData = {
      id: item.user_id,
      name: item.user?.name || 'Unknown',
      username: item.user?.username || 'unknown',
      avatar: item.user?.image_uri || '',
      role: item.role || 'member',
      onlineStatus: 'offline' as OnlineStatus, // TODO: Implement real online status
    };
    
    const isCurrentUser = item.user_id === user?.id;
    
    return (
      <MemberCard
        member={memberData}
        onPress={() => {
          console.log('Member clicked:', memberData.name, memberData.username, 'isCurrentUser:', isCurrentUser);
          if (isCurrentUser) {
            // Navigate to profile tab for current user
            router.push('/(tabs)/profile');
          } else {
            // Navigate to member's profile
            router.push(`/profile/${memberData.username}`);
          }
        }}
        currentUserRole={permissions.role || 'member'}
        showActions={false} // Remove the ... buttons as requested
      />
    );
  };
  
  const renderAvatarStack = () => {
    const displayMembers = currentCircle.members.slice(0, 3);
    const remainingCount = currentCircle.members.length - 3;
    
    return (
      <View style={styles.avatarStack}>
        {displayMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatarContainer,
              { 
                backgroundColor: colors.border,
                marginLeft: index > 0 ? -12 : 0,
                zIndex: 3 - index,
              }
            ]}
          >
            <Image source={{ uri: member.user?.image_uri || '' }} style={styles.avatar} />
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={[styles.remainingCount, { marginLeft: -12 }]}>
            <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
              +{remainingCount}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {activeTab === 'chat' ? (
        // Chat gets its own layout without ScrollView to handle keyboard properly
        <>
          {/* Navigation Bar for chat */}
          <View style={[styles.navBar, { backgroundColor: colors.background }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            
            <View style={styles.navCenter}>
              <Text style={[styles.navTitle, { color: colors.text }]}>{currentCircle.name}</Text>
              <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>
                {currentCircle.members.length} members
              </Text>
            </View>
            
            <View style={styles.navActions}>
              <Pressable 
                style={[styles.navButtonOutline, { borderColor: colors.border }]}
                onPress={async () => {
                  try {
                    await shareCircleInvite(
                      { id: currentCircle.id, name: currentCircle.name, description: currentCircle.description },
                      { id: user?.id || '', name: user?.user_metadata?.full_name || user?.email || 'Someone' }
                    );
                  } catch (error) {
                    console.error('Failed to share invite:', error);
                  }
                }}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.text} />
                <Text style={[styles.navButtonText, { color: colors.text }]}>Invite</Text>
              </Pressable>
              {permissions.canEditCircle && (
                <Pressable 
                  style={styles.navButton}
                  onPress={() => router.push(`/circles/${id}/settings`)}
                >
                  <Ionicons name="settings-outline" size={20} color={colors.text} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Tabs for chat */}
          <View style={[styles.tabs, { backgroundColor: colors.border }]}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'activity' && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab('activity')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'activity' ? colors.text : colors.textSecondary }
              ]}>
                Activity
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'chat' && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab('chat')}
            >
              <View style={styles.tabWithBadge}>
                <Ionicons 
                  name="chatbubbles" 
                  size={20} 
                  color={activeTab === 'chat' ? colors.text : colors.textSecondary} 
                />
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'chat' ? colors.text : colors.textSecondary }
                ]}>
                  Chat
                </Text>
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'members' && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab('members')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'members' ? colors.text : colors.textSecondary }
              ]}>
                Members
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'insights' && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab('insights')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'insights' ? colors.text : colors.textSecondary }
              ]}>
                Insights
              </Text>
            </Pressable>
          </View>

          {/* Chat component takes remaining space */}
          <CircleChat
            circleId={id as string}
            circleName={currentCircle.name}
            members={currentCircle.members.map(m => ({
              id: m.user_id,
              name: m.user?.name || 'Unknown',
              username: m.user?.username || 'unknown',
              avatar: m.user?.image_uri || '',
              role: m.role,
              onlineStatus: 'offline' as OnlineStatus,
            }))}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserAvatar={currentUser.avatar}
          />
        </>
      ) : (
        // All other tabs use ScrollView
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Navigation Bar */}
          <View style={[styles.navBar, { backgroundColor: colors.background }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            
            <View style={styles.navCenter}>
              <Text style={[styles.navTitle, { color: colors.text }]}>{currentCircle.name}</Text>
              <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>
                {currentCircle.members.length} members
              </Text>
            </View>
            
            <View style={styles.navActions}>
              <Pressable 
                style={[styles.navButtonOutline, { borderColor: colors.border }]}
                onPress={async () => {
                  try {
                    await shareCircleInvite(
                      { id: currentCircle.id, name: currentCircle.name, description: currentCircle.description },
                      { id: user?.id || '', name: user?.user_metadata?.full_name || user?.email || 'Someone' }
                    );
                  } catch (error) {
                    console.error('Failed to share invite:', error);
                  }
                }}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.text} />
                <Text style={[styles.navButtonText, { color: colors.text }]}>Invite</Text>
              </Pressable>
              {permissions.canEditCircle && (
                <Pressable 
                  style={styles.navButton}
                  onPress={() => router.push(`/circles/${id}/settings`)}
                >
                  <Ionicons name="settings-outline" size={20} color={colors.text} />
                </Pressable>
              )}
            </View>
          </View>
          
          {/* Circle Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
            <View style={styles.infoCardRow}>
              {renderAvatarStack()}
              <Text style={[styles.circleName, { color: colors.primary }]}>{currentCircle.name}</Text>
              {currentCircle.isActive && (
                <View style={[styles.activeBadge, { backgroundColor: colors.statusActive }]}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              )}
            </View>
            <Text style={[styles.createdText, { color: colors.textSecondary }]}>
              Created 2 months ago
            </Text>
            <Text style={[styles.circleDescription, { color: colors.text, marginTop: 16 }]}>
              {currentCircle.description}
            </Text>
          </View>
          
          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: colors.border }]}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'activity' && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab('activity')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'activity' ? colors.text : colors.textSecondary }
              ]}>
                Activity
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'chat' && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab('chat')}
            >
              <View style={styles.tabWithBadge}>
                <Ionicons 
                  name="chatbubbles" 
                  size={20} 
                  color={activeTab === 'chat' ? colors.text : colors.textSecondary} 
                />
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'chat' ? colors.text : colors.textSecondary }
                ]}>
                  Chat
                </Text>
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'members' && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab('members')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'members' ? colors.text : colors.textSecondary }
              ]}>
                Members
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'insights' && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab('insights')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'insights' ? colors.text : colors.textSecondary }
              ]}>
                Insights
              </Text>
            </Pressable>
          </View>
          
          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'activity' ? (
              <FlatList
                data={updates}
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
            ) : activeTab === 'members' ? (
              <FlatList
                data={currentCircle.members}
                renderItem={renderMember}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            ) : (
              <View>
                <CircleStatsCard
                  stats={{
                    postsThisMonth: 1,
                    onlineMembers: 0, // TODO: Implement real online status
                    totalMembers: currentCircle.members.length,
                    mostActiveMembers: currentCircle.members.slice(0, 3).map((m, idx) => ({
                      member: {
                        id: m.user_id,
                        name: m.user?.name || 'Unknown',
                        username: m.user?.username || 'unknown',
                        avatar: m.user?.image_uri || '',
                        role: m.role,
                        onlineStatus: 'offline' as OnlineStatus,
                      },
                      interactions: 0, // TODO: Track real interactions
                    }))
                  }}
                />
              </View>
            )}
          </View>
        </ScrollView>
      )}
      
      {selectedUpdateId && (
        <CommentModal
          visible={commentModalVisible}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedUpdateId(null);
          }}
          onSubmitComment={handleSubmitComment}
          dateId={selectedUpdateId}
          personName={updates.find(u => u.id === selectedUpdateId)?.personName || ''}
          existingComments={updates.find(u => u.id === selectedUpdateId)?.comments?.map((c, idx) => ({
            id: `${selectedUpdateId}-${idx}`,
            name: c.name,
            content: c.content,
          })) || []}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  navSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  navActions: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    padding: 8,
  },
  navButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  createdText: {
    fontSize: 14,
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  remainingCount: {
    marginLeft: 4,
  },
  remainingText: {
    fontSize: 14,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerContent: {
    gap: 8,
  },
  circleName: {
    fontSize: 20,
    fontWeight: '600',
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
    fontSize: 32,
    fontWeight: '700',
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
    marginBottom: 16,
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  moreButton: {
    padding: 8,
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
  statsCard: {
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  activeCard: {
    padding: 24,
    borderRadius: 16,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  activeList: {
    gap: 12,
  },
  activeMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activeMemberInfo: {
    flex: 1,
  },
  activeMemberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeMemberStat: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});