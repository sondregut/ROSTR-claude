import React, { useState } from 'react';
import { StyleSheet, SectionList, View, Text, Pressable, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ProfileCard } from '@/components/ui/cards/ProfileCard';
import { AddPersonModal, PersonData } from '@/components/ui/modals/AddPersonModal';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getPersonNameFromRosterId } from '@/lib/rosterUtils';
import { useRoster } from '@/contexts/RosterContext';


export default function RosterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { activeRoster, pastConnections, isLoading, addPerson, refreshRoster, updateEntry, deleteEntry } = useRoster();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleAddPerson = async (personData: PersonData) => {
    try {
      await addPerson(personData.name, personData);
      setShowAddModal(false);
      // Navigate to roster tab
      router.push('/(tabs)/roster');
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  const handleEditPerson = async (personData: PersonData) => {
    if (!editingPerson) return;
    
    try {
      // Update the roster entry with new data
      await updateEntry(editingPerson.id, {
        name: personData.name,
        age: personData.age ? parseInt(personData.age) : undefined,
        occupation: personData.occupation,
        location: personData.location,
        how_we_met: personData.howWeMet,
        interests: personData.interests,
        instagram: personData.instagram,
        notes: personData.notes,
        photos: personData.photos,
      });
      setEditingPerson(null);
      // Navigate to roster tab
      router.push('/(tabs)/roster');
    } catch (error) {
      console.error('Error updating person:', error);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRoster();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const [editingPerson, setEditingPerson] = useState<typeof activeRoster[0] | null>(null);

  const handleOptionsPress = (item: typeof activeRoster[0]) => {
    const statusOptions = ['active', 'new', 'fading', 'ended', 'ghosted'];
    
    Alert.alert(
      item.name,
      'Choose an action',
      [
        {
          text: 'View Profile',
          onPress: () => {
            router.push(`/person/${encodeURIComponent(item.name)}?rosterId=${item.id}&isOwnRoster=true`);
          }
        },
        {
          text: 'Edit Profile',
          onPress: () => {
            setEditingPerson(item);
          }
        },
        {
          text: 'Change Status',
          onPress: () => {
            Alert.alert(
              'Change Status',
              `Current status: ${item.status}`,
              [
                ...statusOptions.map(status => ({
                  text: status.charAt(0).toUpperCase() + status.slice(1),
                  onPress: async () => {
                    try {
                      await updateEntry(item.id, { status: status as any });
                    } catch (error) {
                      Alert.alert('Error', 'Failed to update status');
                    }
                  }
                })),
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Entry',
              `Are you sure you want to delete ${item.name} from your roster?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteEntry(item.id);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete entry');
                    }
                  }
                }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  // Prepare data for SectionList
  const sections = [
    {
      title: 'Active Roster',
      data: activeRoster,
    },
    {
      title: 'Past Connections',
      data: pastConnections,
    },
  ].filter(section => section.data.length > 0); // Only show sections with data

  const renderItem = ({ item }: { item: typeof activeRoster[0] }) => (
    <ProfileCard
      id={item.id}
      name={item.name}
      avatarUri={item.photos?.[0]}
      lastDate={item.lastDate}
      nextDate={item.nextDate}
      rating={item.rating}
      status={item.status}
      onPress={() => {
        // Navigate to roster person detail screen with the roster entry ID
        router.push(`/person/${encodeURIComponent(item.name)}?rosterId=${item.id}&isOwnRoster=true`);
      }}
      onOptionsPress={() => handleOptionsPress(item)}
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
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Roster</Text>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No roster entries yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add someone to start tracking your dates</Text>
          <Pressable 
            style={[styles.emptyAddButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyAddButtonText}>Add First Person</Text>
          </Pressable>
        </View>
      ) : (
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
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}
      
      <AddPersonModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddPerson}
      />
      
      <AddPersonModal
        visible={!!editingPerson}
        onClose={() => setEditingPerson(null)}
        onSave={handleEditPerson}
        initialData={editingPerson ? {
          name: editingPerson.name,
          age: editingPerson.age?.toString() || '',
          occupation: editingPerson.occupation || '',
          location: editingPerson.location || '',
          howWeMet: editingPerson.how_we_met || '',
          interests: editingPerson.interests || '',
          instagram: editingPerson.instagram || '',
          notes: editingPerson.notes || '',
          photos: editingPerson.photos || [],
        } : undefined}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
