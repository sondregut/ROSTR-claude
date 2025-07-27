import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Avatar } from '@/components/ui/Avatar';
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock data for detailed person view
const MOCK_PERSON_DATA = {
  '1': {
    id: '1',
    name: 'David',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    status: 'active' as const,
    ownerName: 'Sarah Chen',
    ownerAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    stats: {
      totalDates: 4,
      averageRating: 4.3,
      lastDate: '2 days ago',
      nextDate: 'This weekend',
    },
    dateHistory: [
      {
        id: '1',
        date: '1d ago',
        rating: 4.5,
        notes: 'Third date with David and I\'m officially smitten! We went hiking and talked for hours about everything and nothing.',
        tags: ['Third Date', 'Chemistry', 'Outdoorsy'],
        poll: {
          question: 'Is David boyfriend material?',
          options: [
            { text: 'Absolutely', votes: 8, percentage: 80 },
            { text: 'Getting there', votes: 2, percentage: 20 },
            { text: 'Not yet', votes: 0, percentage: 0 },
          ]
        }
      },
      {
        id: '2',
        date: '1w ago',
        rating: 4.2,
        notes: 'Second date was even better than the first! Dinner at that Italian place was amazing. Great conversation and lots of laughs.',
        tags: ['Second Date', 'Chemistry', 'Italian Food'],
      },
      {
        id: '3',
        date: '2w ago',
        rating: 4.0,
        notes: 'First coffee date went well. He was funny and easy to talk to. Looking forward to seeing him again.',
        tags: ['First Date', 'Coffee', 'Good Vibes'],
      },
    ]
  },
  '2': {
    id: '2',
    name: 'Marcus',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    status: 'new' as const,
    ownerName: 'Sarah Chen',
    ownerAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    stats: {
      totalDates: 2,
      averageRating: 3.8,
      lastDate: '1 week ago',
    },
    dateHistory: [
      {
        id: '1',
        date: '1w ago',
        rating: 4.0,
        notes: 'Second date at the art museum. He knows a lot about art and was really passionate about it. Good conversation but not sure about the spark yet.',
        tags: ['Second Date', 'Art Museum', 'Intellectual'],
      },
      {
        id: '2',
        date: '3w ago',
        rating: 3.5,
        notes: 'Met Marcus at a friend\'s party. He seems nice and we had a good time talking about books and travel.',
        tags: ['First Date', 'Books', 'Travel'],
      },
    ]
  },
};

export default function PersonDetailScreen() {
  const { username, personId } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Get person data - in real app, this would be fetched from database
  const personData = MOCK_PERSON_DATA[personId as keyof typeof MOCK_PERSON_DATA] || MOCK_PERSON_DATA['1'];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.statusActive;
      case 'new':
        return colors.statusNew;
      case 'fading':
        return colors.statusFading;
      case 'ended':
        return colors.statusEnded;
      case 'ghosted':
        return colors.statusGhosted;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color={colors.statusFading} />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color={colors.statusFading} />
      );
    }
    
    return stars;
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
            <Text style={[styles.navTitle, { color: colors.text }]}>
              {personData.ownerName} & {personData.name}
            </Text>
            <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>
              {personData.stats.totalDates} dates • {personData.stats.averageRating.toFixed(1)}/5 avg
            </Text>
          </View>
          
          <View style={{ width: 32 }} />
        </View>

        {/* Person Header */}
        <View style={[styles.personHeader, { backgroundColor: colors.card }]}>
          <View style={styles.personInfo}>
            <Avatar
              uri={personData.avatar}
              name={personData.name}
              size={64}
            />
            
            <View style={styles.personDetails}>
              <Text style={[styles.personName, { color: colors.text }]}>
                {personData.name}
              </Text>
              
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(personData.status) }
              ]}>
                <Text style={styles.statusText}>
                  {getStatusLabel(personData.status)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Status</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {getStatusLabel(personData.status)}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last date</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {personData.stats.lastDate}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average rating</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {personData.stats.averageRating.toFixed(1)}/5
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total dates</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {personData.stats.totalDates}
              </Text>
            </View>
          </View>
        </View>

        {/* Date History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Date History
          </Text>
          
          {personData.dateHistory.map((dateEntry, index) => (
            <View key={dateEntry.id} style={[styles.dateCard, { backgroundColor: colors.card }]}>
              {/* Date Header */}
              <View style={styles.dateHeader}>
                <View style={styles.dateAuthor}>
                  <Avatar
                    uri={personData.ownerAvatar}
                    name={personData.ownerName}
                    size={32}
                  />
                  <View style={styles.dateAuthorInfo}>
                    <Text style={[styles.authorName, { color: colors.text }]}>
                      {personData.ownerName}
                    </Text>
                    <Text style={[styles.dateTime, { color: colors.textSecondary }]}>
                      {dateEntry.date}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.dateRating}>
                  <View style={styles.stars}>
                    {renderStars(dateEntry.rating)}
                  </View>
                  <Text style={[styles.ratingText, { color: colors.primary }]}>
                    {dateEntry.rating}/5
                  </Text>
                </View>
              </View>
              
              {/* Date Content */}
              <Text style={[styles.dateNotes, { color: colors.text }]}>
                {dateEntry.notes}
              </Text>
              
              {/* Tags */}
              <View style={styles.dateTags}>
                {dateEntry.tags.map((tag, tagIndex) => (
                  <View key={tagIndex} style={[styles.tag, { backgroundColor: colors.tagBackground }]}>
                    <Text style={[styles.tagText, { color: colors.tagText }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* Poll */}
              {dateEntry.poll && (
                <View style={[styles.poll, { borderTopColor: colors.border }]}>
                  <Text style={[styles.pollQuestion, { color: colors.text }]}>
                    {dateEntry.poll.question}
                  </Text>
                  
                  {dateEntry.poll.options.map((option, optionIndex) => (
                    <View key={optionIndex} style={styles.pollOption}>
                      <View style={styles.pollOptionHeader}>
                        <Text style={[styles.pollOptionText, { color: colors.text }]}>
                          {option.text}
                        </Text>
                        <Text style={[styles.pollVotes, { color: colors.textSecondary }]}>
                          {option.votes} ({option.percentage}%)
                        </Text>
                      </View>
                      
                      <View style={[styles.pollBar, { backgroundColor: colors.border }]}>
                        <View 
                          style={[
                            styles.pollBarFill, 
                            { 
                              width: `${option.percentage}%`,
                              backgroundColor: colors.primary 
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
  personHeader: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  personDetails: {
    marginLeft: 16,
    flex: 1,
  },
  personName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  dateCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateAuthorInfo: {
    marginLeft: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateTime: {
    fontSize: 12,
    marginTop: 2,
  },
  dateRating: {
    alignItems: 'flex-end',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateNotes: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  dateTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  poll: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pollOption: {
    marginBottom: 12,
  },
  pollOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pollOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pollVotes: {
    fontSize: 14,
  },
  pollBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pollBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});