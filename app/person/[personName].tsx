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
import AddPlanModal, { PlanFormData } from '@/components/ui/modals/AddPlanModal';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDates } from '@/contexts/DateContext';
import { openInstagramProfile, getDisplayUsername } from '@/lib/instagramUtils';

// Friend dating data - represents friends' perspectives on their dates
const FRIEND_DATING_DATA = {
  'emma': {
    'jordan': {
      name: 'Jordan',
      age: 26,
      occupation: 'Graphic Designer',
      location: 'Brooklyn, NY',
      howWeMet: "Friend's party",
      avatarUri: 'https://randomuser.me/api/portraits/women/44.jpg',
      instagramUsername: 'jordandesigns',
      
      status: 'active' as const,
      totalDates: 3,
      averageRating: 4.3,
      lastDate: '2h ago',
      upcomingPlans: 1,
      
      notes: 'Met at Sarah\'s party and we instantly clicked! Jordan is so creative and passionate about design. The chemistry is definitely there and I love how we can talk for hours.',
      interests: ['Design', 'Art', 'Coffee', 'Indie Music', 'Vintage Shopping'],
      
      compatibility: {
        communication: 9.0,
        humor: 8.5,
        values: 8.0,
        physical: 9.0,
        lifestyle: 8.5,
      },
      
      nextDate: {
        planned: true,
        date: 'This weekend',
        activity: 'Art gallery opening',
        location: 'Chelsea galleries',
        excitement: 9,
      },
      
      dateHistory: [
        {
          id: '3',
          personName: 'Jordan',
          date: '2h ago',
          location: 'Italian Restaurant',
          rating: 4.5,
          notes: 'Dinner date at that new Italian place was amazing! Great conversation, lots of laughing. Definitely seeing them again.',
          tags: ['Third Date', 'Chemistry', 'Romantic'],
          instagramUsername: 'jordandesigns',
          imageUri: 'https://randomuser.me/api/portraits/women/44.jpg',
          likeCount: 1,
          commentCount: 0,
          isLiked: false,
          comments: [],
        },
        {
          id: '2',
          personName: 'Jordan',
          date: '1 week ago',
          location: 'Coffee Shop',
          rating: 4.2,
          notes: 'Second coffee date went even better than the first. We talked about art and design for hours. Jordan showed me some of their portfolio work.',
          tags: ['Second Date', 'Art', 'Creative'],
          instagramUsername: 'jordandesigns',
          imageUri: 'https://randomuser.me/api/portraits/women/44.jpg',
          likeCount: 3,
          commentCount: 2,
          isLiked: true,
          comments: [
            { name: 'Sarah', content: 'Love seeing you so happy!' },
            { name: 'Mike', content: 'Jordan sounds amazing' }
          ],
        },
        {
          id: '1',
          personName: 'Jordan',
          date: '2 weeks ago',
          location: 'Local Bar',
          rating: 4.0,
          notes: 'Met Jordan at Sarah\'s party and we ended up talking all night. Went out for drinks after and had such a good time!',
          tags: ['First Date', 'Party', 'Instant Connection'],
          instagramUsername: 'jordandesigns',
          imageUri: 'https://randomuser.me/api/portraits/women/44.jpg',
          likeCount: 5,
          commentCount: 1,
          isLiked: true,
          comments: [
            { name: 'Sarah', content: 'So glad you two met at my party!' }
          ],
        }
      ]
    },
    'alex': {
      name: 'Alex',
      age: 28,
      occupation: 'Software Engineer',
      location: 'Manhattan, NY',
      howWeMet: 'Bumble',
      avatarUri: 'https://randomuser.me/api/portraits/men/32.jpg',
      instagramUsername: 'alex_codes',
      
      status: 'ended' as const,
      totalDates: 2,
      averageRating: 3.5,
      lastDate: '3 weeks ago',
      upcomingPlans: 0,
      
      notes: 'Had a couple of dates but didn\'t feel the spark. Nice person but we just didn\'t click romantically.',
      interests: ['Tech', 'Hiking', 'Photography'],
      
      compatibility: {
        communication: 7.0,
        humor: 6.5,
        values: 7.5,
        physical: 6.0,
        lifestyle: 7.0,
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
          personName: 'Alex',
          date: '3 weeks ago',
          location: 'Coffee Shop',
          rating: 3.5,
          notes: 'Second coffee date. Conversation was okay but I\'m not feeling the romantic connection. Decided to end things amicably.',
          tags: ['Second Date', 'Ended', 'Mutual Decision'],
          instagramUsername: 'alex_codes',
          imageUri: 'https://randomuser.me/api/portraits/men/32.jpg',
          likeCount: 0,
          commentCount: 0,
          isLiked: false,
          comments: [],
        }
      ]
    }
  },
  'sarah': {
    'alex': {
      name: 'Alex',
      age: 28,
      occupation: 'Software Engineer',
      location: 'Manhattan, NY',
      howWeMet: 'Bumble',
      avatarUri: 'https://randomuser.me/api/portraits/men/32.jpg',
      instagramUsername: 'alex_codes',
      
      status: 'active' as const,
      totalDates: 1,
      averageRating: 4.5,
      lastDate: '2h ago',
      upcomingPlans: 1,
      
      notes: 'Great first date! Really enjoyed our conversation about travel and shared interests.',
      interests: ['Travel', 'Tech', 'Coffee'],
      
      compatibility: {
        communication: 8.5,
        humor: 8.0,
        values: 8.5,
        physical: 8.0,
        lifestyle: 8.0,
      },
      
      nextDate: {
        planned: true,
        date: 'Next week',
        activity: 'Dinner date',
        location: 'Downtown',
        excitement: 8,
      },
      
      dateHistory: [
        {
          id: '1',
          personName: 'Alex',
          date: '2h ago',
          location: 'Coffee Shop',
          rating: 4.5,
          notes: 'Great conversation over coffee. Talked about travel plans and shared interests. Looking forward to seeing them again!',
          tags: ['First Date', 'Chemistry', 'Travel'],
          instagramUsername: 'alex_codes',
          imageUri: 'https://randomuser.me/api/portraits/men/32.jpg',
          likeCount: 3,
          commentCount: 2,
          isLiked: false,
          comments: [
            { name: 'Mike', content: 'Sounds promising!' },
            { name: 'Emma', content: 'Keep us updated!' }
          ],
        }
      ]
    }
  }
};

// Enhanced unified mock data structure (your own roster)
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
      {
        id: '5',
        personName: 'Alex',
        date: '1 week ago',
        location: 'Central Park',
        rating: 4.0,
        notes: 'Walked around Central Park for 3 hours just talking. Really comfortable conversation and lots of laughs. He\'s easy to be around.',
        tags: ['Outdoorsy', 'Good Vibes'],
        instagramUsername: 'alex_codes',
        imageUri: 'https://randomuser.me/api/portraits/men/32.jpg',
        likeCount: 5,
        commentCount: 1,
        isLiked: false,
        comments: [
          { name: 'Sarah', content: 'Central Park walks are the best for getting to know someone!' }
        ],
      },
      {
        id: '4',
        personName: 'Alex',
        date: '2 weeks ago',
        location: 'Brooklyn Museum',
        rating: 4.3,
        notes: 'Third date at the museum was perfect. He knows so much about art and was really passionate explaining different pieces. Love a guy who\'s cultured!',
        tags: ['Third Date', 'Culture', 'Art'],
        instagramUsername: 'alex_codes',
        imageUri: 'https://randomuser.me/api/portraits/men/32.jpg',
        likeCount: 12,
        commentCount: 4,
        isLiked: true,
        comments: [
          { name: 'Emma', content: 'Art museum dates are so underrated!' },
          { name: 'Mike', content: 'Sounds like a keeper!' },
          { name: 'Sarah', content: 'Third date vibes! 👀' },
          { name: 'Jordan', content: 'Brooklyn Museum is gorgeous' }
        ],
        poll: {
          question: 'Is this turning into something serious?',
          options: [
            { text: 'Absolutely', votes: 15 },
            { text: 'Getting there', votes: 4 },
            { text: 'Too early to tell', votes: 1 }
          ]
        }
      },
      {
        id: '3',
        personName: 'Alex',
        date: '3 weeks ago',
        location: 'Italian Bistro',
        rating: 4.1,
        notes: 'Second date dinner was amazing! Great food and even better conversation. We stayed until they almost kicked us out. Definitely want to see him again.',
        tags: ['Second Date', 'Italian Food', 'Chemistry'],
        instagramUsername: 'alex_codes',
        imageUri: 'https://randomuser.me/api/portraits/men/32.jpg',
        likeCount: 7,
        commentCount: 2,
        isLiked: true,
        comments: [
          { name: 'Sarah', content: 'Italian food always makes dates better!' },
          { name: 'Emma', content: 'Love when they close the place down talking 💕' }
        ],
      },
      {
        id: '2',
        personName: 'Alex',
        date: '1 month ago',
        location: 'Coffee Shop',
        rating: 3.8,
        notes: 'First coffee date went really well. He was funny and easy to talk to, seemed genuinely interested in getting to know me. Looking forward to seeing him again!',
        tags: ['First Date', 'Coffee', 'Good Vibes'],
        instagramUsername: 'alex_codes',
        imageUri: 'https://randomuser.me/api/portraits/men/32.jpg',
        likeCount: 3,
        commentCount: 1,
        isLiked: false,
        comments: [
          { name: 'Mike', content: 'Coffee dates are perfect for getting to know someone!' }
        ],
      }
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
      {
        id: '1',
        personName: 'Jordan',
        date: '3 weeks ago',
        location: 'Local Bar',
        rating: 3.5,
        notes: 'Met Jordan at Sarah\'s party and we hit it off. Went out for drinks after and had a good time talking about design and travel.',
        tags: ['First Date', 'Drinks', 'Design'],
        instagramUsername: 'jordandesigns',
        imageUri: 'https://randomuser.me/api/portraits/women/44.jpg',
        likeCount: 2,
        commentCount: 0,
        isLiked: false,
        comments: [],
      }
    ]
  },
  'taylor': {
    name: 'Taylor',
    age: 29,
    occupation: 'Product Manager',
    location: 'Chelsea, NY',
    howWeMet: 'Coffee Meets Bagel',
    avatarUri: 'https://randomuser.me/api/portraits/women/89.jpg',
    instagramUsername: 'taylor_explores',
    
    status: 'active' as const,
    totalDates: 8,
    averageRating: 4.5,
    lastDate: '2 days ago',
    upcomingPlans: 1,
    
    notes: 'Taylor is amazing! Smart, funny, and we share so many interests. Things are getting serious and I really see potential here.',
    interests: ['Yoga', 'Travel', 'Reading', 'Wine', 'Hiking', 'Cooking'],
    
    compatibility: {
      communication: 9.5,
      humor: 9.0,
      values: 8.5,
      physical: 9.0,
      lifestyle: 9.2,
    },
    
    nextDate: {
      planned: true,
      date: 'This Friday',
      activity: 'Wine tasting in Brooklyn',
      location: 'Brooklyn Winery',
      excitement: 10,
    },
    
    dateHistory: [
      {
        id: '8',
        personName: 'Taylor',
        date: '2 days ago',
        location: 'Sushi Restaurant',
        rating: 4.8,
        notes: 'Best date yet! We talked about taking a trip together. The connection is getting stronger every time we meet.',
        tags: ['Eighth Date', 'Romantic', 'Future Plans'],
        instagramUsername: 'taylor_explores',
        imageUri: 'https://randomuser.me/api/portraits/women/89.jpg',
        likeCount: 15,
        commentCount: 5,
        isLiked: true,
        comments: [
          { name: 'Sarah', content: 'Trip planning already?! 😍' },
          { name: 'Mike', content: 'This is moving fast!' },
          { name: 'Emma', content: 'So happy for you!' },
          { name: 'Jordan', content: 'Sushi dates are the best' },
          { name: 'Alex', content: 'When\'s the wedding? 😉' }
        ],
      }
    ]
  },
  'morgan': {
    name: 'Morgan',
    age: 30,
    occupation: 'Marketing Manager',
    location: 'Upper East Side, NY',
    howWeMet: 'Hinge',
    avatarUri: 'https://randomuser.me/api/portraits/men/22.jpg',
    instagramUsername: 'morgan_nyc',
    
    status: 'fading' as const,
    totalDates: 4,
    averageRating: 2.5,
    lastDate: '5 days ago',
    upcomingPlans: 0,
    
    notes: 'Things started well but we don\'t seem to have much in common. Conversations are getting harder and I think we\'re both feeling it.',
    interests: ['Fitness', 'Travel', 'Fashion', 'Nightlife'],
    
    compatibility: {
      communication: 4.0,
      humor: 3.0,
      values: 5.0,
      physical: 6.0,
      lifestyle: 4.0,
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
        id: '4',
        personName: 'Morgan',
        date: '5 days ago',
        location: 'Cocktail Bar',
        rating: 2.0,
        notes: 'Met for drinks but the conversation felt really forced. We ran out of things to talk about pretty quickly. I think we both know this isn\'t working.',
        tags: ['Fourth Date', 'Awkward', 'Fading'],
        instagramUsername: 'morgan_nyc',
        imageUri: 'https://randomuser.me/api/portraits/men/22.jpg',
        likeCount: 0,
        commentCount: 2,
        isLiked: false,
        comments: [
          { name: 'Emma', content: 'Maybe it\'s just not meant to be?' },
          { name: 'Mike', content: 'Don\'t force it if it\'s not working' }
        ],
      }
    ]
  },
  'riley': {
    name: 'Riley',
    age: 27,
    occupation: 'Architect',
    location: 'Williamsburg, NY',
    howWeMet: 'Through friends',
    avatarUri: 'https://randomuser.me/api/portraits/women/28.jpg',
    instagramUsername: 'riley_designs',
    
    status: 'ended' as const,
    totalDates: 6,
    averageRating: 3.0,
    lastDate: '3 weeks ago',
    upcomingPlans: 0,
    
    notes: 'We dated for about 2 months but ultimately decided we were better as friends. No hard feelings, just wasn\'t the right match.',
    interests: ['Architecture', 'Art', 'Museums', 'Coffee', 'Sketching'],
    
    compatibility: {
      communication: 6.0,
      humor: 5.5,
      values: 7.0,
      physical: 4.0,
      lifestyle: 6.5,
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
        id: '6',
        personName: 'Riley',
        date: '3 weeks ago',
        location: 'Coffee Shop',
        rating: 3.0,
        notes: 'Had the talk over coffee. We both agreed that while we enjoy each other\'s company, the romantic spark just isn\'t there. Ending on good terms.',
        tags: ['Last Date', 'Mutual Decision', 'Friends'],
        instagramUsername: 'riley_designs',
        imageUri: 'https://randomuser.me/api/portraits/women/28.jpg',
        likeCount: 4,
        commentCount: 3,
        isLiked: true,
        comments: [
          { name: 'Sarah', content: 'At least you\'re both on the same page' },
          { name: 'Jordan', content: 'Mature way to handle it' },
          { name: 'Emma', content: 'Better to end it honestly' }
        ],
      }
    ]
  },
  'casey': {
    name: 'Casey',
    age: 25,
    occupation: 'Startup Founder',
    location: 'SoHo, NY',
    howWeMet: 'Raya',
    avatarUri: 'https://randomuser.me/api/portraits/men/65.jpg',
    instagramUsername: 'caseyfounder',
    
    status: 'ghosted' as const,
    totalDates: 2,
    averageRating: 1.5,
    lastDate: '2 months ago',
    upcomingPlans: 0,
    
    notes: 'Went on two dates and then they completely disappeared. No explanation, just stopped responding to texts. Pretty disappointing.',
    interests: ['Startups', 'Tech', 'Networking', 'Podcasts'],
    
    compatibility: {
      communication: 2.0,
      humor: 4.0,
      values: 3.0,
      physical: 5.0,
      lifestyle: 2.0,
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
        personName: 'Casey',
        date: '2 months ago',
        location: 'Tech Event',
        rating: 1.5,
        notes: 'Second date at a tech meetup. They spent most of the time networking and barely paid attention to me. Haven\'t heard from them since.',
        tags: ['Second Date', 'Ghosted', 'Disappointed'],
        instagramUsername: 'caseyfounder',
        imageUri: 'https://randomuser.me/api/portraits/men/65.jpg',
        likeCount: 0,
        commentCount: 4,
        isLiked: false,
        comments: [
          { name: 'Sarah', content: 'Their loss!' },
          { name: 'Mike', content: 'Ghosting is so immature' },
          { name: 'Emma', content: 'You deserve better' },
          { name: 'Jordan', content: 'On to the next!' }
        ],
      }
    ]
  }
};

type TabType = 'overview' | 'match' | 'plans';

export default function UnifiedPersonDetailScreen() {
  const { personName, friendUsername, isOwnRoster } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [addPlanModalVisible, setAddPlanModalVisible] = useState(false);
  
  const { plans, addPlan } = useDates();
  
  // Determine context: own roster vs friend's date
  const isViewingOwnRoster = isOwnRoster === 'true' || (!friendUsername && !isOwnRoster);
  const viewingFriendDate = !isViewingOwnRoster && friendUsername;
  
  // Get person data based on context
  const personData = viewingFriendDate && friendUsername
    ? FRIEND_DATING_DATA[friendUsername as keyof typeof FRIEND_DATING_DATA]?.[personName as string]
    : MOCK_PERSON_DATA[personName as keyof typeof MOCK_PERSON_DATA];
  
  if (!personData) {
    const errorMessage = viewingFriendDate 
      ? `${friendUsername ? friendUsername.charAt(0).toUpperCase() + friendUsername.slice(1) : 'Your friend'} hasn't shared details about ${personName || 'this person'} yet`
      : 'Person not found';
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>{errorMessage}</Text>
          <Pressable onPress={() => router.back()} style={[styles.backToFeedButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.backToFeedText}>Go Back</Text>
          </Pressable>
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

  const handleAddPlan = async (planData: PlanFormData) => {
    if (personData?.name) {
      await addPlan(planData, personData.name);
    }
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
          
          <Text style={[styles.navTitle, { color: colors.text }]}>
            {isViewingOwnRoster ? 'Profile' : personData?.name || 'Profile'}
          </Text>
          
          <View style={styles.navActions}>
            <Pressable style={styles.navButton}>
              <Ionicons name="create-outline" size={20} color={colors.text} />
            </Pressable>
            <Pressable style={styles.navButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Consolidated Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Main Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: personData.avatarUri }} style={styles.largeAvatar} />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.mainPersonName, { color: colors.text }]}>{personData.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(personData.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(personData.status) }]}>
                    {personData.status.charAt(0).toUpperCase() + personData.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.profileDetails, { color: colors.textSecondary }]}>
                {personData.age} • {personData.occupation}
              </Text>
              <Text style={[styles.profileContext, { color: colors.textSecondary }]}>
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
          
          {/* Integrated Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{personData.totalDates}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dates</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.primary }]}>{personData.averageRating}</Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{personData.upcomingPlans}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
            </View>
          </View>
          
          <Text style={[styles.lastSeenText, { color: colors.textSecondary }]}>
            Last date: {personData.lastDate}
          </Text>
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
                  <Pressable style={styles.editButton}>
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                  </Pressable>
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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isViewingOwnRoster ? 'Date History' : `${friendUsername ? friendUsername.charAt(0).toUpperCase() + friendUsername.slice(1) + "'s" : 'Their'} dates with ${personData?.name || 'this person'}`}
              </Text>
                <View style={styles.datesList}>
                  {personData.dateHistory.map((date) => (
                    <DateCard
                      key={date.id}
                      id={date.id}
                      personName={isViewingOwnRoster ? "" : date.personName} // Show name only for friend's dates
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
                      onPersonHistoryPress={() => {
                        if (isViewingOwnRoster) {
                          // Already on person page
                        } else {
                          // Navigate to this person's roster from friend's perspective
                          router.push(`/person/${date.personName.toLowerCase()}?friendUsername=${friendUsername}`);
                        }
                      }}
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
              <View style={styles.plansHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Plans</Text>
                {isViewingOwnRoster && (
                  <Pressable
                    style={[styles.addPlanButton, { backgroundColor: colors.primary }]}
                    onPress={() => setAddPlanModalVisible(true)}
                  >
                    <Ionicons name="calendar" size={16} color="white" />
                    <Text style={styles.addPlanText}>Plan Date</Text>
                  </Pressable>
                )}
              </View>
              
              {/* Show plans from context for this person */}
              {plans.filter(plan => plan.personName.toLowerCase() === personData?.name?.toLowerCase()).length > 0 ? (
                <View style={styles.plansList}>
                  {plans
                    .filter(plan => plan.personName.toLowerCase() === personData?.name?.toLowerCase())
                    .map((plan) => (
                      <View
                        key={plan.id}
                        style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <View style={styles.planHeader}>
                          <Ionicons name="calendar" size={24} color={colors.primary} />
                          <View style={styles.planInfo}>
                            <Text style={[styles.planActivity, { color: colors.text }]}>
                              {plan.location}
                            </Text>
                            <Text style={[styles.planDateTime, { color: colors.textSecondary }]}>
                              {plan.date}{plan.time ? ` • ${plan.time}` : ''}
                            </Text>
                          </View>
                        </View>
                        {plan.content && (
                          <Text style={[styles.planNotes, { color: colors.text }]}>
                            {plan.content}
                          </Text>
                        )}
                        {isViewingOwnRoster && (
                          <View style={styles.planActions}>
                            <Pressable style={[styles.planActionButton, { backgroundColor: colors.primary }]}>
                              <Text style={styles.planActionText}>Add Details</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    ))}
                </View>
              ) : (
                <View style={[styles.noPlansCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.noPlansText, { color: colors.textSecondary }]}>
                    {isViewingOwnRoster ? 'No upcoming plans scheduled' : 'No plans visible'}
                  </Text>
                  {isViewingOwnRoster && (
                    <Text style={[styles.noPlansSubtext, { color: colors.textSecondary }]}>
                      Plan your next date to keep track of upcoming activities!
                    </Text>
                  )}
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

      {/* Add Plan Modal */}
      {personData && (
        <AddPlanModal
          visible={addPlanModalVisible}
          onClose={() => setAddPlanModalVisible(false)}
          onSubmit={handleAddPlan}
          personName={personData.name}
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
    paddingBottom: Platform.OS === 'ios' ? 60 : 50,
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
    marginTop: 16,
    marginBottom: 24,
  },
  backToFeedButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backToFeedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    padding: 8,
  },
  profileSection: {
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
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
  mainPersonName: {
    fontSize: 28,
    fontWeight: '700',
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
  profileDetails: {
    fontSize: 16,
    marginBottom: 4,
  },
  profileContext: {
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  lastSeenText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 8,
    marginBottom: 8,
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
    paddingHorizontal: 8,
  },
  aboutCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  datesList: {
    gap: 8,
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
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPlanText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  planActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  planActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  planActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  noPlansSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  planButton: {
    minWidth: 150,
  },
});