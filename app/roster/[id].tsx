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

// Enhanced mock data structure
const MOCK_PERSON_DATA = {
  '1': {
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
    
    // Recent Activity
    recentActivity: [
      {
        dateNumber: 6,
        timeAgo: '3 days ago',
        location: 'Rooftop Restaurant',
        duration: '3hrs',
        rating: 4.5,
        preview: 'Amazing dinner at that rooftop place! The view was incredible and we talked for hours...',
      },
      {
        dateNumber: 5,
        timeAgo: '1 week ago',
        location: 'Metropolitan Museum',
        duration: '4hrs',
        rating: 4.0,
        preview: 'Went to the art museum together. Alex knows so much about art history...',
      },
    ],
    
    // Complete Date History
    dates: [
      {
        id: 'd6',
        dateNumber: 6,
        personName: 'Jamie',
        date: '3 days ago',
        location: 'Rooftop Restaurant',
        rating: 4.5,
        notes: 'Amazing dinner at that rooftop place! Alex surprised me with reservations at my favorite spot. The view was incredible and we talked for hours about our travel plans. Definitely feeling a strong connection.',
        tags: ['Sixth Date', 'Chemistry', 'Romantic'],
        likeCount: 5,
        commentCount: 3,
        isLiked: true,
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        comments: [
          { name: 'Sarah', content: 'So happy for you!' },
          { name: 'Mike', content: 'Sounds like a great match' },
          { name: 'Emma', content: 'Can\'t wait for the next update!' }
        ],
      },
      {
        id: 'd5',
        dateNumber: 5,
        personName: 'Jamie',
        date: '1 week ago',
        location: 'Metropolitan Museum',
        rating: 4.0,
        notes: 'Went to the art museum together. Alex knows so much about art history and made it really interesting. We spent hours exploring and then grabbed coffee after.',
        tags: ['Fifth Date', 'Cultural', 'Great Conversation'],
        likeCount: 3,
        commentCount: 1,
        isLiked: false,
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        comments: [
          { name: 'Jordan', content: 'Museums are always a good choice!' }
        ],
      },
      {
        id: 'd4',
        dateNumber: 4,
        personName: 'Jamie',
        date: '2 weeks ago',
        location: 'Central Park',
        rating: 3.8,
        notes: 'Coffee and a long walk through the park. Weather was perfect. We talked about our families and future goals.',
        tags: ['Fourth Date', 'Casual', 'Deep Conversation'],
        likeCount: 2,
        commentCount: 0,
        isLiked: false,
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        comments: [],
      },
      {
        id: 'd3',
        dateNumber: 3,
        personName: 'Jamie',
        date: '3 weeks ago',
        location: 'Cooking Class',
        rating: 4.2,
        notes: 'Took a cooking class together - so much fun! We made pasta from scratch and Alex was surprisingly good at it.',
        tags: ['Third Date', 'Activity Date', 'Fun'],
        likeCount: 4,
        commentCount: 2,
        isLiked: true,
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        comments: [
          { name: 'Alex', content: 'Cooking together is so fun!' },
          { name: 'Taylor', content: 'Did you keep the recipe?' }
        ],
      },
    ],
    
    // Compatibility Scores
    compatibility: {
      communication: 9,
      humor: 8,
      values: 7,
      physical: 8,
      lifestyle: 9,
      overall: 8.2,
    },
    
    // Upcoming Plans
    upcomingPlansData: [
      {
        id: 'p1',
        activity: 'Dinner at Italian place',
        date: 'Tomorrow',
        time: '7:00 PM',
        location: 'Little Italy',
        notes: "Alex suggested this place they've been wanting to try. I made reservations for 7pm.",
        isNext: true,
      },
    ],
  },
  '2': {
    // Jordan - New Status
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
    interests: ['Art', 'Design', 'Coffee', 'Indie Music'],
    
    recentActivity: [
      {
        dateNumber: 2,
        timeAgo: '1 week ago',
        location: 'Art Gallery',
        duration: '2hrs',
        rating: 4.0,
        preview: 'Visited a local art gallery. Jordan knew a lot about the artists...',
      },
    ],
    
    dates: [
      {
        id: 'd2',
        dateNumber: 2,
        personName: 'Jamie',
        date: '1 week ago',
        location: 'Art Gallery',
        rating: 4.0,
        notes: 'Visited a local art gallery in Chelsea. Jordan knew a lot about the artists and their techniques. Very impressive!',
        tags: ['Second Date', 'Cultural', 'Interesting'],
        likeCount: 1,
        commentCount: 0,
        isLiked: false,
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        comments: [],
      },
      {
        id: 'd1',
        dateNumber: 1,
        personName: 'Jamie',
        date: '2 weeks ago',
        location: 'Coffee Shop',
        rating: 3.5,
        notes: 'First coffee date. A bit nervous at first but opened up after a while. Talked mostly about work and hobbies.',
        tags: ['First Date', 'Coffee Date', 'Getting to Know'],
        likeCount: 2,
        commentCount: 1,
        isLiked: false,
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        comments: [
          { name: 'Sarah', content: 'First dates are always nerve-wracking!' }
        ],
      },
    ],
    
    compatibility: {
      communication: 7,
      humor: 6,
      values: 7,
      physical: 8,
      lifestyle: 7,
      overall: 7.0,
    },
    
    upcomingPlansData: [],
  },
  '4': {
    // Morgan - Fading Status
    name: 'Morgan',
    age: 30,
    occupation: 'Marketing Manager',
    location: 'Upper East Side, NY',
    howWeMet: 'Hinge',
    avatarUri: 'https://randomuser.me/api/portraits/men/22.jpg',
    instagramUsername: 'morgan_teaches',
    
    status: 'fading' as const,
    totalDates: 4,
    averageRating: 2.5,
    lastDate: '5 days ago',
    upcomingPlans: 0,
    
    notes: "Things started well but we don't seem to have much in common. Conversations are getting harder.",
    interests: ['Fitness', 'Travel', 'Fashion'],
    
    recentActivity: [
      {
        dateNumber: 4,
        timeAgo: '5 days ago',
        location: 'Bar',
        duration: '1.5hrs',
        rating: 2.0,
        preview: 'Drinks were okay but conversation felt forced...',
      },
    ],
    
    dates: [
      {
        id: 'd4',
        dateNumber: 4,
        personName: 'Jamie',
        date: '5 days ago',
        location: 'Cocktail Bar',
        rating: 2.0,
        notes: 'Met for drinks but the conversation felt really forced. We ran out of things to talk about pretty quickly.',
        tags: ['Fourth Date', 'Awkward', 'Fading'],
        likeCount: 0,
        commentCount: 2,
        isLiked: false,
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        comments: [
          { name: 'Emma', content: 'Maybe it\'s just not meant to be?' },
          { name: 'Mike', content: 'Don\'t force it if it\'s not working' }
        ],
      },
    ],
    
    compatibility: {
      communication: 4,
      humor: 3,
      values: 5,
      physical: 6,
      lifestyle: 4,
      overall: 4.4,
    },
    
    upcomingPlansData: [],
  },
};

type TabType = 'overview' | 'match' | 'plans';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  
  // Get person data
  const personData = MOCK_PERSON_DATA[id as keyof typeof MOCK_PERSON_DATA] || MOCK_PERSON_DATA['1'];
  const [dates, setDates] = useState(personData.dates);
  
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
    switch (status) {
      case 'active': return colors.statusActive + '20';
      case 'new': return colors.statusNew + '20';
      case 'fading': return colors.statusFading + '20';
      case 'ended': return colors.statusEnded + '20';
      default: return colors.border;
    }
  };
  
  const handleComment = (dateId: string) => {
    setSelectedDateId(dateId);
    setCommentModalVisible(true);
  };
  
  const handleLike = (dateId: string) => {
    setDates(dates.map(date => 
      date.id === dateId 
        ? { 
            ...date, 
            isLiked: !date.isLiked,
            likeCount: date.isLiked ? date.likeCount - 1 : date.likeCount + 1 
          } 
        : date
    ));
  };

  const handleSubmitComment = (text: string) => {
    if (!selectedDateId) return;
    
    setDates(dates.map(date => 
      date.id === selectedDateId
        ? {
            ...date,
            comments: [
              ...(date.comments || []),
              { name: 'You', content: text }
            ],
            commentCount: date.commentCount + 1
          }
        : date
    ));
  };
  
  const renderOverviewTab = () => (
    <View style={styles.tabContentContainer}>
      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About {personData.name}</Text>
        <Text style={[styles.aboutText, { color: colors.text }]}>{personData.notes}</Text>
        
        {personData.interests.length > 0 && (
          <>
            <Text style={[styles.subsectionTitle, { color: colors.text }]}>Interests</Text>
            <View style={styles.interestTags}>
              {personData.interests.map((interest, index) => (
                <View key={index} style={[styles.interestTag, { backgroundColor: colors.border }]}>
                  <Text style={[styles.interestText, { color: colors.text }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
      
      {/* Recent Dates Section */}
      <View style={styles.dateHistoryHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Dates</Text>
        <Pressable
          style={[styles.addDateButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/update')}
        >
          <Ionicons name="calendar" size={16} color="white" />
          <Text style={styles.addDateText}>Add Date</Text>
        </Pressable>
      </View>
      
      <View style={styles.datesList}>
        {dates.map((date) => (
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
            likeCount={date.likeCount}
            commentCount={date.commentCount}
            isLiked={date.isLiked}
            imageUri={date.authorAvatar}
            comments={date.comments}
            onLike={() => handleLike(date.id)}
            onComment={() => handleComment(date.id)}
          />
        ))}
      </View>
    </View>
  );
  
  const renderMatchTab = () => {
    const compatibility = personData.compatibility;
    
    const getCompatibilityColor = (score: number) => {
      if (score >= 7) return colors.statusActive;
      if (score >= 5) return colors.statusFading;
      return colors.statusEnded;
    };
    
    return (
      <View style={styles.tabContentContainer}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Compatibility Score</Text>
          
          {/* Individual Scores */}
          <View style={styles.compatibilityList}>
            {Object.entries(compatibility).map(([key, value]) => {
              if (key === 'overall') return null;
              
              return (
                <View key={key} style={styles.compatibilityItem}>
                  <Text style={[styles.compatibilityLabel, { color: colors.text }]}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <View style={styles.compatibilityBarContainer}>
                    <View style={[styles.compatibilityBarBg, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.compatibilityBarFill,
                          { 
                            width: `${value * 10}%`,
                            backgroundColor: getCompatibilityColor(value)
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.compatibilityScore, { color: colors.text }]}>
                      {value}/10
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          
          {/* Overall Score */}
          <View style={[styles.overallScoreContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.overallScoreValue, { color: colors.primary }]}>
              {compatibility.overall}/10
            </Text>
            <Text style={[styles.overallScoreLabel, { color: colors.textSecondary }]}>
              Overall Compatibility
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderPlansTab = () => {
    const hasPlans = personData.upcomingPlansData.length > 0;
    
    return (
      <View style={styles.tabContentContainer}>
        <View style={styles.dateHistoryHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Plans</Text>
          <Pressable
            style={[styles.addDateButton, { backgroundColor: colors.primary }]}
            onPress={() => console.log('Add plan')}
          >
            <Ionicons name="calendar" size={16} color="white" />
            <Text style={styles.addDateText}>Add Plan</Text>
          </Pressable>
        </View>
        
        {hasPlans ? (
          <View style={styles.plansList}>
            {personData.upcomingPlansData.map((plan) => (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  { 
                    backgroundColor: colors.card,
                    borderColor: plan.isNext ? colors.primary : colors.border,
                    borderWidth: plan.isNext ? 2 : 1,
                  }
                ]}
              >
                {plan.isNext && (
                  <View style={[styles.nextDateBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.nextDateText, { color: colors.primary }]}>Next Date</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <Ionicons name="calendar" size={24} color={colors.primary} />
                  <View style={styles.planInfo}>
                    <Text style={[styles.planActivity, { color: colors.text }]}>
                      {plan.activity}
                    </Text>
                    <Text style={[styles.planDateTime, { color: colors.textSecondary }]}>
                      {plan.date} • {plan.time} • {plan.location}
                    </Text>
                  </View>
                </View>
                {plan.notes && (
                  <Text style={[styles.planNotes, { color: colors.text }]}>
                    {plan.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No upcoming plans scheduled
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
              Add a plan to keep track of your next date!
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.headerName, { color: colors.text }]}>{personData.name}</Text>
            <View style={styles.headerActions}>
              <Pressable style={styles.headerButton}>
                <Ionicons name="pencil" size={20} color={colors.text} />
              </Pressable>
              <Pressable style={styles.headerButton}>
                <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>
          <Text style={[styles.headerStats, { color: colors.textSecondary }]}>
            {personData.totalDates} dates • {personData.averageRating}/5 avg
          </Text>
        </View>
        
        {/* Person Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryTop}>
            <Image source={{ uri: personData.avatarUri }} style={styles.avatar} />
            <View style={styles.summaryInfo}>
              <View style={styles.summaryNameRow}>
                <Text style={[styles.summaryName, { color: colors.text }]}>
                  {personData.name}
                </Text>
                <View 
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(personData.status) }
                  ]}
                >
                  <Text 
                    style={[
                      styles.statusText,
                      { color: getStatusColor(personData.status) }
                    ]}
                  >
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
            <Text style={[styles.metricDivider, { color: colors.border }]}>•</Text>
            <Text style={[styles.metricText, { color: colors.text }]}>
              Last: {personData.lastDate}
            </Text>
          </View>
        </View>
        
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {personData.totalDates}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Dates
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {personData.averageRating}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Avg Rating
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {personData.upcomingPlans}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Upcoming
            </Text>
          </View>
        </View>
        
        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.border }]}>
          {(['overview', 'match', 'plans'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && [styles.activeTab, { backgroundColor: colors.background }]
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.text : colors.textSecondary }
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        
        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'match' && renderMatchTab()}
          {activeTab === 'plans' && renderPlansTab()}
        </View>
      </ScrollView>
      
      {selectedDateId && (
        <CommentModal
          visible={commentModalVisible}
          onClose={() => {
            setCommentModalVisible(false);
            setSelectedDateId(null);
          }}
          onSubmitComment={handleSubmitComment}
          dateId={selectedDateId}
          personName={dates.find(d => d.id === selectedDateId)?.personName || ''}
          existingComments={dates.find(d => d.id === selectedDateId)?.comments?.map((c, idx) => ({
            id: `${selectedDateId}-${idx}`,
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerStats: {
    fontSize: 14,
    marginLeft: 40,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  summaryName: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryDetails: {
    fontSize: 16,
    marginBottom: 2,
  },
  summaryContext: {
    fontSize: 14,
  },
  summaryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 16,
  },
  metricDivider: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  tabContentContainer: {
    paddingHorizontal: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
  },
  interestTags: {
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
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLine: {
    width: 3,
    backgroundColor: '#ccc',
    marginTop: 8,
    borderRadius: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  timelineTime: {
    fontSize: 14,
  },
  timelinePreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  timelineMeta: {
    marginTop: 4,
  },
  timelineMetaText: {
    fontSize: 13,
  },
  dateHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addDateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  datesList: {
    gap: 12,
  },
  compatibilityList: {
    gap: 16,
  },
  compatibilityItem: {
    gap: 8,
  },
  compatibilityLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  compatibilityBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compatibilityBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  compatibilityBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  compatibilityScore: {
    fontSize: 16,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  overallScoreContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  overallScoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  overallScoreLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
  },
  nextDateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  nextDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
  },
  planActivity: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  planDateTime: {
    fontSize: 14,
  },
  planNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  emptyState: {
    padding: 48,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
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
});