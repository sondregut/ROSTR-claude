import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  Switch,
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
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock data - in real app, this would come from database
const MOCK_CIRCLE_DATA = {
  '1': {
    name: 'Besties',
    description: 'My closest friends who know everything about my dating life',
    createdAt: '2024-01-01',
    isActive: true,
    members: [
      { id: '1', name: 'Sarah Chen', username: 'sarahc', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', role: 'owner' as MemberRole, onlineStatus: 'online' as OnlineStatus },
      { id: '2', name: 'Mike Johnson', username: 'mikej', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'admin' as MemberRole, onlineStatus: 'online' as OnlineStatus },
      { id: '3', name: 'Emma Wilson', username: 'emmaw', avatar: 'https://randomuser.me/api/portraits/women/22.jpg', role: 'member' as MemberRole, onlineStatus: 'offline' as OnlineStatus },
      { id: '4', name: 'Jason Martinez', username: 'jasonm', avatar: 'https://randomuser.me/api/portraits/men/11.jpg', role: 'member' as MemberRole, onlineStatus: 'online' as OnlineStatus },
      { id: '5', name: 'Alex Rodriguez', username: 'alexr', avatar: 'https://randomuser.me/api/portraits/men/43.jpg', role: 'member' as MemberRole, onlineStatus: 'offline' as OnlineStatus },
    ],
    recentUpdates: [
      {
        id: '1',
        personName: 'Alex',
        date: '2h ago',
        location: 'Coffee Shop',
        rating: 4.5,
        notes: 'Great conversation over coffee. Talked about travel plans.',
        tags: ['First Date', 'Chemistry'],
        instagramUsername: 'alex_codes',
        author: 'Sarah Johnson',
        authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        likeCount: 3,
        commentCount: 2,
        isLiked: false,
        comments: [
          { name: 'Mike', content: 'Sounds promising!' },
          { name: 'Emma', content: 'Keep us updated!' }
        ],
      },
      {
        id: '2',
        personName: 'Jordan',
        date: '2h ago',
        location: 'Italian Restaurant',
        rating: 4.5,
        notes: 'Dinner date at that new Italian place was amazing! Great conversation, lots of laughing. Definitely seeing him again.',
        tags: ['Second Date', 'Chemistry'],
        instagramUsername: 'jordandesigns',
        author: 'Emma',
        authorAvatar: 'https://randomuser.me/api/portraits/women/22.jpg',
        likeCount: 1,
        commentCount: 0,
        isLiked: false,
        comments: [],
        poll: {
          question: 'Will there be a third date?',
          options: [
            { text: 'Yes', votes: 3 },
            { text: 'Maybe', votes: 1 },
            { text: 'No', votes: 0 }
          ]
        }
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
  const [activeTab, setActiveTab] = useState<'activity' | 'members' | 'insights'>('activity');
  const [updates, setUpdates] = useState(MOCK_CIRCLE_DATA[id as keyof typeof MOCK_CIRCLE_DATA]?.recentUpdates || []);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  
  // Get circle data - in real app, this would be fetched from database
  const circleData = MOCK_CIRCLE_DATA[id as keyof typeof MOCK_CIRCLE_DATA] || MOCK_CIRCLE_DATA['1'];
  
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
              { name: 'You', content: text }
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
        const member = circleData.members.find(m => m.name === item.author);
        if (member) {
          router.push(`/profile/${member.username}`);
        }
      }}
    />
  );
  
  const renderMember = ({ item }: { item: MemberData }) => (
    <MemberCard
      member={item}
      onPress={() => router.push(`/profile/${item.username}`)}
      currentUserRole="owner" // This would be dynamic based on current user
    />
  );
  
  const renderAvatarStack = () => {
    const displayMembers = circleData.members.slice(0, 3);
    const remainingCount = circleData.members.length - 3;
    
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
            <Image source={{ uri: member.avatar }} style={styles.avatar} />
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={[styles.navBar, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          
          <View style={styles.navCenter}>
            <Text style={[styles.navTitle, { color: colors.text }]}>{circleData.name}</Text>
            <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>
              {circleData.members.length} members
            </Text>
          </View>
          
          <View style={styles.navActions}>
            <Pressable style={[styles.navButtonOutline, { borderColor: colors.border }]}>
              <Ionicons name="person-add-outline" size={18} color={colors.text} />
              <Text style={[styles.navButtonText, { color: colors.text }]}>Invite</Text>
            </Pressable>
            <Pressable style={styles.navButton}>
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
        
        {/* Circle Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
          <View style={styles.infoCardRow}>
            {renderAvatarStack()}
            <Text style={[styles.circleName, { color: colors.primary }]}>{circleData.name}</Text>
            {circleData.isActive && (
              <View style={[styles.activeBadge, { backgroundColor: colors.statusActive }]}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={[styles.createdText, { color: colors.textSecondary }]}>
            Created 2 months ago
          </Text>
          <Text style={[styles.circleDescription, { color: colors.text, marginTop: 16 }]}>
            {circleData.description}
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
              data={circleData.members}
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
                  onlineMembers: circleData.members.filter(m => m.onlineStatus === 'online').length,
                  totalMembers: circleData.members.length,
                  mostActiveMembers: [
                    { member: circleData.members[0], interactions: 19 },
                    { member: circleData.members[1], interactions: 12 },
                    { member: circleData.members[2], interactions: 15 },
                  ]
                }}
              />
            </View>
          )}
        </View>
        
      </ScrollView>
      
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
});