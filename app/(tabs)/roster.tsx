import React, { useState } from 'react';
import { StyleSheet, SectionList, View, Text, Pressable, useColorScheme, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ProfileCard } from '@/components/ui/cards/ProfileCard';
import { AddPersonModal, PersonData } from '@/components/ui/modals/AddPersonModal';
import { Colors } from '@/constants/Colors';

// Mock data for demonstration
// Define the types for our roster entries
type RosterStatus = 'active' | 'new' | 'fading' | 'ended' | 'ghosted';

interface RosterEntry {
  id: string;
  name: string;
  lastDate: string;
  nextDate?: string;
  rating: number;
  status: RosterStatus;
}

const ACTIVE_ROSTER: RosterEntry[] = [
  {
    id: '1',
    name: 'Alex',
    lastDate: '3 days ago',
    nextDate: 'Tomorrow',
    rating: 4.2,
    status: 'active',
  },
  {
    id: '2',
    name: 'Jordan',
    lastDate: '1 week ago',
    rating: 3.8,
    status: 'new',
  },
  {
    id: '3',
    name: 'Taylor',
    lastDate: '2 days ago',
    rating: 4.5,
    status: 'active',
  },
  {
    id: '4',
    name: 'Morgan',
    lastDate: '5 days ago',
    rating: 2.5,
    status: 'fading',
  },
];

const PAST_CONNECTIONS: RosterEntry[] = [
  {
    id: '5',
    name: 'Riley',
    lastDate: '3 weeks ago',
    rating: 3.0,
    status: 'ended',
  },
  {
    id: '6',
    name: 'Casey',
    lastDate: '2 months ago',
    rating: 1.5,
    status: 'ghosted',
  },
];

export default function RosterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeRoster, setActiveRoster] = useState(ACTIVE_ROSTER);
  
  const handleAddPerson = (personData: PersonData) => {
    // Create new roster entry from person data
    const newEntry: RosterEntry = {
      id: Date.now().toString(),
      name: personData.name,
      lastDate: 'Never',
      rating: 0,
      status: 'new',
    };
    
    setActiveRoster([...activeRoster, newEntry]);
    setShowAddModal(false);
    
    // In a real app, this would save to a database
    console.log('New person added:', personData);
  };
  
  // Prepare data for SectionList
  const sections = [
    {
      title: 'Active Roster',
      data: activeRoster,
    },
    {
      title: 'Past Connections',
      data: PAST_CONNECTIONS,
    },
  ];

  const renderItem = ({ item }: { item: RosterEntry }) => (
    <ProfileCard
      id={item.id}
      name={item.name}
      lastDate={item.lastDate}
      nextDate={item.nextDate}
      rating={item.rating}
      status={item.status}
      onPress={() => {
        // Navigate to profile detail
        router.push(`/roster/${item.id}`);
      }}
    />
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      {section.title === 'Active Roster' && (
        <Pressable 
          style={[styles.addButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={[styles.addButtonText, { color: colors.text }]}>+ Add</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Roster</Text>
      </View>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        stickySectionHeadersEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
        bounces={true}
      />
      
      <AddPersonModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddPerson}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Adjust for tab bar height
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
