import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { DateCard } from '@/components/ui/cards/DateCard';
import { CommentModal } from '@/components/ui/modals/CommentModal';
import { useColorScheme } from '@/hooks/useColorScheme';
import { openInstagramProfile, getDisplayUsername } from '@/lib/instagramUtils';

// Enhanced unified mock data structure
const MOCK_PERSON_DATA = {
  'alex': {
    // Basic Info
    name: 'Alex',
    age: 28,
    occupation: 'Software Engineer',
    location: 'Manhattan, NY',
    howWeMet: 'Bumble',
    avatarUri: 'https://randomuser.me/api/portraits/men/32.jpg',
    instagramUsername: 'alex_codes',
    
    // Dating Stats
    status: 'active' as const,
    totalDates: 6,
    averageRating: 4.2,
    lastDate: '3 days ago',
    upcomingPlans: 1,
    
    // About
    notes: 'Really sweet and funny. Great conversation skills. Loves trying new restaurants. We have a lot in common and the chemistry is definitely there.',
    interests: ['Hiking', 'Photography', 'Cooking', 'Travel', 'Board Games', 'Wine Tasting'],
    
    // Compatibility Scores
    compatibility: {
      communication: 8.5,
      humor: 9.2,
      values: 7.8,
      physical: 8.0,
      lifestyle: 8.7,
    },
    
    // Upcoming Plans
    nextDate: {
      planned: true,
      date: 'This Saturday',
      activity: 'Cooking class together',
      location: 'Chelsea Market',
      excitement: 9,
    },
    
    // Complete Dating History
    dateHistory: [
      {
        id: '6',
        personName: 'Alex',
        date: '3 days ago',
        location: 'Rooftop Restaurant',
        rating: 4.5,
        notes: 'Amazing dinner at that rooftop place! The view was incredible and we talked for hours about everything and nothing. Definitely feeling a real connection here.',
        tags: ['Romantic', 'Great Conversation'],
        instagramUsername: 'alex_codes',
        imageUri: 'https://randomuser.me/api/portraits/men/32.jpg',
        likeCount: 8,
        commentCount: 3,
        isLiked: true,
        comments: [
          { name: 'Sarah', content: 'This sounds amazing! So happy for you!' },
          { name: 'Mike', content: 'Rooftop restaurants hit different 🌆' },
          { name: 'Emma', content: 'When is the next date??' }
        ],
      },
    ]
  },
  'jordan': {
    name: 'Jordan',
    age: 26,
    occupation: 'Graphic Designer',
    location: 'Brooklyn, NY',
    howWeMet: "Friend's party",
    avatarUri: 'https://randomuser.me/api/portraits/women/44.jpg',
    instagramUsername: 'jordandesigns',
    
    status: 'new' as const,
    totalDates: 2,
    averageRating: 3.8,
    lastDate: '1 week ago',
    upcomingPlans: 0,
    
    notes: 'Creative and interesting but still getting to know them. Seems really passionate about their work.',
    interests: ['Design', 'Art', 'Coffee', 'Indie Music', 'Vintage Shopping'],
    
    compatibility: {
      communication: 7.5,
      humor: 8.0,
      values: 6.5,
      physical: 7.8,
      lifestyle: 7.2,
    },
    
    nextDate: {
      planned: false,
      date: null,
      activity: null,
      location: null,
      excitement: null,
    },
    
    dateHistory: [
      {
        id: '2',
        personName: 'Jordan',
        date: '1 week ago',
        location: 'Art Gallery',
        rating: 4.0,
        notes: 'Second date at the gallery opening was fun. Jordan knows everyone in the art scene and was really in their element. Great conversation about creativity.',
        tags: ['Second Date', 'Art', 'Creative'],
        instagramUsername: 'jordandesigns',
        imageUri: 'https://randomuser.me/api/portraits/women/44.jpg',
        likeCount: 4,
        commentCount: 1,
        isLiked: true,
        comments: [
          { name: 'Emma', content: 'Art gallery dates are so cool!' }
        ],
      },
    ]
  },
  'daniel': {
    name: 'Daniel',
    age: 30,
    occupation: 'Architect',
    location: 'Chelsea, NY',
    howWeMet: 'Coffee Meets Bagel',
    avatarUri: 'https://randomuser.me/api/portraits/men/78.jpg',
    instagramUsername: 'daniel_architect',
    
    status: 'active' as const,
    totalDates: 5,
    averageRating: 4.5,
    lastDate: '2 days ago',
    upcomingPlans: 2,
    
    notes: 'Daniel is incredible! Smart, ambitious, and we have amazing chemistry. He designed his own apartment and it\'s stunning. Really see potential here.',
    interests: ['Architecture', 'Art', 'Wine', 'Travel', 'Photography', 'Modern Design'],
    
    compatibility: {
      communication: 9.0,
      humor: 8.5,
      values: 9.0,
      physical: 9.0,
      lifestyle: 8.0,
    },
    
    nextDate: {
      planned: true,
      date: 'This weekend',
      activity: 'Wine tasting and dinner',
      location: 'Brooklyn Winery',
      excitement: 10,
    },
    
    dateHistory: [
      {
        id: '5',
        personName: 'Daniel',
        date: '2 days ago',
        location: 'Museum of Modern Art',
        rating: 4.8,
        notes: 'Perfect afternoon at MoMA! Daniel knew so much about the architecture and design. We spent hours discussing art and life. The connection keeps getting stronger.',
        tags: ['Fifth Date', 'Art', 'Deep Connection'],
        instagramUsername: 'daniel_architect',
        imageUri: 'https://randomuser.me/api/portraits/men/78.jpg',
        likeCount: 12,
        commentCount: 4,
        isLiked: true,
        comments: [
          { name: 'Sarah', content: 'Museum dates with someone who gets it 😍' },
          { name: 'Mike', content: 'Sounds like a keeper!' },
          { name: 'Jordan', content: 'When do we get to meet him??' },
          { name: 'Emma', content: 'The excitement is real!' }
        ],
      },
    ]
  },
  'david': {
    name: 'David',
    age: 32,
    occupation: 'Finance Manager',
    location: 'Upper West Side, NY',
    howWeMet: 'Hinge',
    avatarUri: 'https://randomuser.me/api/portraits/men/45.jpg',
    instagramUsername: 'david_nyc',
    
    status: 'active' as const,
    totalDates: 4,
    averageRating: 4.3,
    lastDate: '4 days ago',
    upcomingPlans: 1,
    
    notes: 'David is sweet and stable. Great sense of humor and very thoughtful. Takes me to the best restaurants in the city. Feeling optimistic about where this is going.',
    interests: ['Finance', 'Golf', 'Wine', 'Fine Dining', 'Theater', 'Travel'],
    
    compatibility: {
      communication: 8.0,
      humor: 8.5,
      values: 8.0,
      physical: 7.5,
      lifestyle: 8.5,
    },
    
    nextDate: {
      planned: true,
      date: 'Next Friday',
      activity: 'Broadway show',
      location: 'Theater District',
      excitement: 8,
    },
    
    dateHistory: [
      {
        id: '4',
        personName: 'David',
        date: '4 days ago',
        location: 'French Restaurant',
        rating: 4.3,
        notes: 'Romantic dinner at a French bistro. David remembered I mentioned wanting to try it weeks ago. Such a thoughtful gesture. Great conversation about our future goals.',
        tags: ['Fourth Date', 'Romantic', 'Thoughtful'],
        instagramUsername: 'david_nyc',
        imageUri: 'https://randomuser.me/api/portraits/men/45.jpg',
        likeCount: 9,
        commentCount: 2,
        isLiked: true,
        comments: [
          { name: 'Emma', content: 'He remembered! That\'s so sweet!' },
          { name: 'Sarah', content: 'The little things matter 💕' }
        ],
      },
    ]
  },
  'marcus': {
    name: 'Marcus',
    age: 29,
    occupation: 'Startup Founder',
    location: 'SoHo, NY',
    howWeMet: 'Mutual friends',
    avatarUri: 'https://randomuser.me/api/portraits/men/67.jpg',
    instagramUsername: 'marcus_tech',
    
    status: 'new' as const,
    totalDates: 2,
    averageRating: 3.8,
    lastDate: '1 week ago',
    upcomingPlans: 0,
    
    notes: 'Marcus is ambitious and driven. Sometimes talks too much about his startup but overall interesting. Still figuring out if there\'s romantic chemistry.',
    interests: ['Tech', 'Startups', 'Networking', 'Coffee', 'Running', 'Podcasts'],
    
    compatibility: {
      communication: 7.0,
      humor: 6.5,
      values: 7.5,
      physical: 7.0,
      lifestyle: 6.0,
    },
    
    nextDate: {
      planned: false,
      date: null,
      activity: null,
      location: null,
      excitement: null,
    },
    
    dateHistory: [
      {
        id: '2',
        personName: 'Marcus',
        date: '1 week ago',
        location: 'Tech Meetup',
        rating: 3.5,
        notes: 'Second date at a tech event. Marcus spent a lot of time networking. Not sure if this is going anywhere romantic.',
        tags: ['Second Date', 'Networking', 'Uncertain'],
        instagramUsername: 'marcus_tech',
        imageUri: 'https://randomuser.me/api/portraits/men/67.jpg',
        likeCount: 1,
        commentCount: 2,
        isLiked: false,
        comments: [
          { name: 'Mike', content: 'Red flag if he ignores you at events' },
          { name: 'Jordan', content: 'Give it one more try?' }
        ],
      },
    ]
  }
};

type TabType = 'overview' | 'match' | 'plans';

export default function RosterPersonDetailScreen() {
  const { person, isOwnRoster } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  
  // Convert isOwnRoster param to boolean
  const showEditButtons = isOwnRoster === 'true';
  
  // Get person data
  const personData = MOCK_PERSON_DATA[person as keyof typeof MOCK_PERSON_DATA];
  
  if (!personData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Person not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.statusActive;
      case 'new': return colors.statusNew;
      case 'fading': return colors.statusFading;
      case 'ended': return colors.statusEnded;
      default: return colors.textSecondary;
    }
  };

  const getStatusBgColor = (status: string) => {
    return getStatusColor(status) + '20';
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 8) return colors.statusActive;
    if (score >= 6) return colors.statusNew;
    return colors.statusFading;
  };

  const handleLike = (dateId: string) => {
    // Handle like functionality
    console.log('Like date:', dateId);
  };

  const handleComment = (dateId: string) => {
    setSelectedDateId(dateId);
    setCommentModalVisible(true);
  };

  const handleSubmitComment = (text: string) => {
    console.log('Submit comment:', text, 'for date:', selectedDateId);
    setCommentModalVisible(false);
    setSelectedDateId(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Navigation Header */}
        <View style={[styles.navBar, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          
          <View style={styles.navCenter}>
            <Text style={[styles.navTitle, { color: colors.text }]}>{personData.name}</Text>
            <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>
              {personData.totalDates} dates • {personData.averageRating}/5 avg rating
            </Text>
          </View>
          
          <View style={styles.navActions}>
            {showEditButtons && (
              <Pressable style={styles.navButton}>
                <Ionicons name="create-outline" size={20} color={colors.text} />
              </Pressable>
            )}
            <Pressable style={styles.navButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Person Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: personData.avatarUri }} style={styles.largeAvatar} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.personName, { color: colors.text }]}>{personData.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(personData.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(personData.status) }]}>
                    {personData.status.charAt(0).toUpperCase() + personData.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.summaryDetails, { color: colors.textSecondary }]}>
                {personData.age} • {personData.occupation}
              </Text>
              <Text style={[styles.summaryContext, { color: colors.textSecondary }]}>
                {personData.location} • {personData.howWeMet}
              </Text>
              
              {/* Instagram Link */}
              {personData.instagramUsername && (
                <Pressable 
                  style={styles.instagramButton}
                  onPress={() => openInstagramProfile(personData.instagramUsername!)}
                >
                  <Ionicons name="logo-instagram" size={16} color={colors.primary} />
                  <Text style={[styles.instagramUsername, { color: colors.primary }]}>
                    {getDisplayUsername(personData.instagramUsername)}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
          
          <View style={styles.summaryMetrics}>
            <View style={styles.metricItem}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.metricText, { color: colors.text }]}>
                {personData.averageRating}/5
              </Text>
            </View>
            <Text style={[styles.metricSeparator, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.metricText, { color: colors.text }]}>
              Last: {personData.lastDate}
            </Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{personData.totalDates}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Dates</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{personData.averageRating}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{personData.upcomingPlans}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.border }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'overview' && [styles.activeTab, { backgroundColor: colors.background }]
            ]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'overview' ? colors.text : colors.textSecondary }
            ]}>
              Overview
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'match' && [styles.activeTab, { backgroundColor: colors.background }]
            ]}
            onPress={() => setActiveTab('match')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'match' ? colors.text : colors.textSecondary }
            ]}>
              Match
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'plans' && [styles.activeTab, { backgroundColor: colors.background }]
            ]}
            onPress={() => setActiveTab('plans')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'plans' ? colors.text : colors.textSecondary }
            ]}>
              Plans
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View>
              {/* About Section */}
              <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.aboutHeader}>
                  <Text style={[styles.aboutTitle, { color: colors.text }]}>About {personData.name}</Text>
                  {showEditButtons && (
                    <Pressable style={styles.editButton}>
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.aboutText, { color: colors.text }]}>{personData.notes}</Text>
                
                {/* Interests */}
                <Text style={[styles.interestsTitle, { color: colors.text }]}>Interests</Text>
                <View style={styles.interestsContainer}>
                  {personData.interests.map((interest, index) => (
                    <View key={index} style={[styles.interestTag, { backgroundColor: colors.tagBackground }]}>
                      <Text style={[styles.interestText, { color: colors.tagText }]}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Date History */}
              <View style={styles.historySection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Date History</Text>
                <View style={styles.datesList}>
                  {personData.dateHistory.map((date) => (
                    <DateCard
                      key={date.id}
                      id={date.id}
                      personName={date.personName}
                      date={date.date}
                      location={date.location}
                      rating={date.rating}
                      notes={date.notes}
                      tags={date.tags}
                      instagramUsername={date.instagramUsername}
                      poll={date.poll}
                      comments={date.comments}
                      likeCount={date.likeCount}
                      commentCount={date.commentCount}
                      isLiked={date.isLiked}
                      onLike={() => handleLike(date.id)}
                      onComment={() => handleComment(date.id)}
                      onPersonHistoryPress={() => {/* Already on person page */}}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'match' && (
            <View style={styles.matchContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Compatibility Breakdown</Text>
              
              {Object.entries(personData.compatibility).map(([category, score]) => (
                <View key={category} style={styles.compatibilityItem}>
                  <View style={styles.compatibilityHeader}>
                    <Text style={[styles.compatibilityLabel, { color: colors.text }]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    <Text style={[styles.compatibilityScore, { color: colors.text }]}>
                      {score}/10
                    </Text>
                  </View>
                  <View style={[styles.compatibilityBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.compatibilityBarFill,
                        { 
                          width: `${score * 10}%`,
                          backgroundColor: getCompatibilityColor(score)
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'plans' && (
            <View style={styles.plansContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Plans</Text>
              
              {personData.nextDate.planned ? (
                <View style={[styles.nextDateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.nextDateHeader}>
                    <Text style={[styles.nextDateTitle, { color: colors.text }]}>Next Date Planned</Text>
                    <Text style={[styles.nextDateDate, { color: colors.primary }]}>
                      {personData.nextDate.date}
                    </Text>
                  </View>
                  <Text style={[styles.nextDateActivity, { color: colors.text }]}>
                    {personData.nextDate.activity}
                  </Text>
                  <Text style={[styles.nextDateLocation, { color: colors.textSecondary }]}>
                    📍 {personData.nextDate.location}
                  </Text>
                  <View style={styles.excitementLevel}>
                    <Text style={[styles.excitementLabel, { color: colors.textSecondary }]}>
                      Excitement Level:
                    </Text>
                    <Text style={[styles.excitementScore, { color: colors.primary }]}>
                      {personData.nextDate.excitement}/10
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.noPlansCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.noPlansText, { color: colors.textSecondary }]}>
                    No upcoming plans scheduled
                  </Text>
                  <Button
                    title="Plan Next Date"
                    variant="primary"
                    onPress={() => console.log('Plan date')}
                    style={styles.planButton}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Comment Modal */}
      {selectedDateId && (
        <CommentModal
          visible={commentModalVisible}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedDateId(null);
          }}
          onSubmitComment={handleSubmitComment}
          dateId={selectedDateId}
          personName={personData.name}
          existingComments={[]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
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
    gap: 8,
  },
  navButton: {
    padding: 8,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personName: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryDetails: {
    fontSize: 16,
    marginBottom: 4,
  },
  summaryContext: {
    fontSize: 14,
    marginBottom: 8,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 2,
  },
  instagramUsername: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricSeparator: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 90,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
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
  aboutCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    padding: 4,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  interestsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  datesList: {
    gap: 12,
  },
  matchContent: {
    gap: 16,
  },
  compatibilityItem: {
    marginBottom: 16,
  },
  compatibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compatibilityLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  compatibilityScore: {
    fontSize: 16,
    fontWeight: '600',
  },
  compatibilityBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  compatibilityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  plansContent: {
    gap: 16,
  },
  nextDateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  nextDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextDateTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  nextDateDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextDateActivity: {
    fontSize: 16,
    marginBottom: 8,
  },
  nextDateLocation: {
    fontSize: 14,
    marginBottom: 12,
  },
  excitementLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  excitementLabel: {
    fontSize: 14,
  },
  excitementScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  noPlansCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  noPlansText: {
    fontSize: 16,
    marginBottom: 16,
  },
  planButton: {
    minWidth: 150,
  },
});