import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';

// Mock data - in a real app, this would come from a database
const MOCK_PERSON_DATA = {
  '1': {
    name: 'Alex',
    age: 28,
    occupation: 'Software Engineer',
    location: 'Brooklyn, NY',
    howWeMet: 'Dating App',
    interests: 'Rock climbing, craft beer, indie music, traveling',
    phone: '(555) 123-4567',
    instagram: '@alex.doe',
    photos: [],
    status: 'active' as const,
    lastDate: '3 days ago',
    nextDate: 'Tomorrow, 7:00 PM',
    averageRating: 4.2,
    dates: [
      {
        id: '1',
        date: '2024-01-15',
        location: 'Coffee Shop',
        rating: 4,
        notes: 'Great conversation about travel plans',
      },
      {
        id: '2', 
        date: '2024-01-20',
        location: 'Italian Restaurant',
        rating: 4.5,
        notes: 'Amazing dinner, lots of laughs',
      },
      {
        id: '3',
        date: '2024-01-25',
        location: 'Art Museum',
        rating: 4,
        notes: 'Fun afternoon exploring the exhibits',
      },
    ],
    compatibility: {
      communication: 85,
      humor: 90,
      values: 75,
      physical: 80,
      lifestyle: 70,
    },
  },
  // Add more mock data as needed
};

type CompatibilityKey = 'communication' | 'humor' | 'values' | 'physical' | 'lifestyle';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [activeTab, setActiveTab] = useState<'dates' | 'compatibility' | 'notes'>('dates');
  
  // Get person data - in a real app, this would be fetched from a database
  const personData = MOCK_PERSON_DATA[id as keyof typeof MOCK_PERSON_DATA] || MOCK_PERSON_DATA['1'];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'new': return '#2196F3';
      case 'fading': return '#FF9800';
      case 'ended': return '#F44336';
      default: return colors.text;
    }
  };
  
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };
  
  const renderCompatibilityBar = (label: string, value: number) => (
    <View style={styles.compatibilityItem}>
      <Text style={[styles.compatibilityLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.compatibilityBarBg, { backgroundColor: colors.border }]}>
        <View 
          style={[
            styles.compatibilityBarFill, 
            { 
              width: `${value}%`,
              backgroundColor: value >= 70 ? '#4CAF50' : value >= 50 ? '#FF9800' : '#F44336'
            }
          ]} 
        />
      </View>
      <Text style={[styles.compatibilityValue, { color: colors.textSecondary }]}>{value}%</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.name, { color: colors.text }]}>{personData.name}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {personData.age} • {personData.occupation}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(personData.status) }]}>
                <Text style={styles.statusText}>{personData.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.quickStats}>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Date</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{personData.lastDate}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Next Date</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{personData.nextDate || 'Not planned'}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
                <View style={styles.ratingContainer}>
                  {renderStars(Math.round(personData.averageRating))}
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Photo Gallery Placeholder */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.photoGallery}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.photoPlaceholder, { backgroundColor: colors.card }]}>
              <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
            </View>
          ))}
        </ScrollView>
        
        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{personData.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>Met via {personData.howWeMet}</Text>
          </View>
          {personData.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{personData.phone}</Text>
            </View>
          )}
          {personData.instagram && (
            <View style={styles.infoRow}>
              <Ionicons name="logo-instagram" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{personData.instagram}</Text>
            </View>
          )}
        </View>
        
        {/* Interests */}
        {personData.interests && (
          <View style={[styles.interestsSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <Text style={[styles.interestsText, { color: colors.text }]}>{personData.interests}</Text>
          </View>
        )}
        
        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.card }]}>
          <Pressable 
            style={[styles.tab, activeTab === 'dates' && styles.activeTab]}
            onPress={() => setActiveTab('dates')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'dates' ? colors.primary : colors.textSecondary }
            ]}>
              Dates ({personData.dates.length})
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'compatibility' && styles.activeTab]}
            onPress={() => setActiveTab('compatibility')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'compatibility' ? colors.primary : colors.textSecondary }
            ]}>
              Compatibility
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
            onPress={() => setActiveTab('notes')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'notes' ? colors.primary : colors.textSecondary }
            ]}>
              Notes
            </Text>
          </Pressable>
        </View>
        
        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'dates' && (
            <View>
              {personData.dates.map((date) => (
                <View key={date.id} style={[styles.dateCard, { backgroundColor: colors.card }]}>
                  <View style={styles.dateHeader}>
                    <Text style={[styles.dateTitle, { color: colors.text }]}>{date.location}</Text>
                    <View style={styles.dateRating}>{renderStars(date.rating)}</View>
                  </View>
                  <Text style={[styles.dateDate, { color: colors.textSecondary }]}>
                    {new Date(date.date).toLocaleDateString()}
                  </Text>
                  {date.notes && (
                    <Text style={[styles.dateNotes, { color: colors.text }]}>{date.notes}</Text>
                  )}
                </View>
              ))}
              
              <Button
                title="Add New Date"
                variant="primary"
                onPress={() => router.push('/update')}
                style={styles.addDateButton}
                leftIcon={<Ionicons name="add-circle-outline" size={20} color="white" />}
              />
            </View>
          )}
          
          {activeTab === 'compatibility' && (
            <View style={[styles.compatibilitySection, { backgroundColor: colors.card }]}>
              {Object.entries(personData.compatibility).map(([key, value]) => (
                renderCompatibilityBar(
                  key.charAt(0).toUpperCase() + key.slice(1), 
                  value
                )
              ))}
            </View>
          )}
          
          {activeTab === 'notes' && (
            <View style={[styles.notesSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.notesText, { color: colors.text }]}>
                No notes yet. Add notes about your experiences, observations, or things to remember.
              </Text>
              <Button
                title="Add Note"
                variant="outline"
                onPress={() => console.log('Add note')}
                style={styles.addNoteButton}
              />
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Edit Profile"
            variant="outline"
            onPress={() => console.log('Edit profile')}
            style={styles.actionButton}
          />
          <Button
            title="Update Status"
            variant="primary"
            onPress={() => console.log('Update status')}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 2,
  },
  photoGallery: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
  },
  interestsSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  interestsText: {
    fontSize: 16,
    lineHeight: 22,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(240, 122, 122, 0.1)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContent: {
    marginHorizontal: 16,
  },
  dateCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateRating: {
    flexDirection: 'row',
  },
  dateDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateNotes: {
    fontSize: 16,
    lineHeight: 22,
  },
  addDateButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  compatibilitySection: {
    padding: 16,
    borderRadius: 12,
  },
  compatibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  compatibilityLabel: {
    flex: 1,
    fontSize: 16,
  },
  compatibilityBarBg: {
    flex: 2,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  compatibilityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  compatibilityValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
  },
  notesSection: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  notesText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  addNoteButton: {
    paddingHorizontal: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});