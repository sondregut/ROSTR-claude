import React from 'react';
import { StyleSheet, View, Text, ScrollView, useColorScheme, Platform, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/Colors';

// Mock user data
const MOCK_USER = {
  name: 'Alex Thompson',
  username: '@alexthompson',
  bio: '🌟 Living life one date at a time',
  joinedDate: 'January 2024',
  imageUri: 'https://randomuser.me/api/portraits/men/32.jpg',
};

// Mock data for demonstration
const MOCK_STATS = {
  totalDates: 28,
  thisMonth: 4,
  avgRating: 3.7,
  topLocations: [
    { name: 'Coffee Shops', count: 8 },
    { name: 'Restaurants', count: 7 },
    { name: 'Parks', count: 5 },
    { name: 'Movies', count: 3 },
  ],
  datesByMonth: [
    { month: 'Jan', count: 3 },
    { month: 'Feb', count: 4 },
    { month: 'Mar', count: 2 },
    { month: 'Apr', count: 5 },
    { month: 'May', count: 4 },
    { month: 'Jun', count: 3 },
    { month: 'Jul', count: 2 },
    { month: 'Aug', count: 1 },
    { month: 'Sep', count: 0 },
    { month: 'Oct', count: 0 },
    { month: 'Nov', count: 0 },
    { month: 'Dec', count: 4 },
  ],
  mostFrequentDay: 'Friday',
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const renderStatCard = (title: string, value: string | number, icon: any) => (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );

  const renderBarChart = () => {
    const maxCount = Math.max(...MOCK_STATS.datesByMonth.map(item => item.count));
    
    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Dates by Month</Text>
        <View style={styles.barChart}>
          {MOCK_STATS.datesByMonth.map((item, index) => (
            <View key={index} style={styles.barColumn}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: colors.primary,
                    opacity: item.count > 0 ? 1 : 0.3,
                  }
                ]} 
              />
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                {item.month}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTopLocations = () => (
    <View style={[styles.locationsCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.locationsTitle, { color: colors.text }]}>Top Date Locations</Text>
      {MOCK_STATS.topLocations.map((location, index) => (
        <View key={index} style={styles.locationItem}>
          <Text style={[styles.locationName, { color: colors.text }]}>
            {location.name}
          </Text>
          <View style={[styles.locationBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.locationBarFill, 
                { 
                  width: `${(location.count / MOCK_STATS.topLocations[0].count) * 100}%`,
                  backgroundColor: colors.primary,
                }
              ]} 
            />
          </View>
          <Text style={[styles.locationCount, { color: colors.textSecondary }]}>
            {location.count}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: MOCK_USER.imageUri }} 
              style={styles.profileImage}
              defaultSource={{ uri: 'https://via.placeholder.com/100' }}
            />
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>{MOCK_USER.name}</Text>
          <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>{MOCK_USER.username}</Text>
          <Text style={[styles.profileBio, { color: colors.text }]}>{MOCK_USER.bio}</Text>
          <Text style={[styles.joinedDate, { color: colors.textSecondary }]}>Joined {MOCK_USER.joinedDate}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => console.log('Edit profile')}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit Profile</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => console.log('Share profile')}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Share</Text>
          </Pressable>
        </View>

        {/* Dating Statistics Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Dating Stats</Text>
          
          <View style={styles.statsGrid}>
            {renderStatCard('Total Dates', MOCK_STATS.totalDates, 'calendar')}
            {renderStatCard('This Month', MOCK_STATS.thisMonth, 'time')}
            {renderStatCard('Avg Rating', MOCK_STATS.avgRating.toFixed(1), 'star')}
            {renderStatCard('Favorite Day', MOCK_STATS.mostFrequentDay, 'sunny')}
          </View>
          
          {renderBarChart()}
          {renderTopLocations()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ff6b6b',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  joinedDate: {
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  barChart: {
    height: 200,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 8,
    minHeight: 4,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  locationsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationName: {
    width: 100,
    fontSize: 14,
  },
  locationBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  locationBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  locationCount: {
    width: 30,
    fontSize: 14,
    textAlign: 'right',
  },
});