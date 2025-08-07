import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Person {
  id: string;
  name: string;
  lastDate?: string;
  rating?: number;
  status?: 'active' | 'new' | 'fading' | 'ended' | 'ghosted';
  photos?: string[];
}

interface PersonSelectorProps {
  value?: string;
  onSelect: (personId: string, personName: string) => void;
  placeholder?: string;
  error?: string;
  people: Person[];
  onAddNew?: () => void;
}

export function PersonSelector({
  value,
  onSelect,
  placeholder = 'Select a person',
  error,
  people,
  onAddNew,
}: PersonSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedPerson = people.find(p => p.id === value);
  
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelect = (person: Person) => {
    onSelect(person.id, person.name);
    setModalVisible(false);
    setSearchQuery('');
  };
  
  const getStatusColor = (status?: Person['status']) => {
    switch(status) {
      case 'active': return colors.statusActive;
      case 'new': return colors.statusNew;
      case 'fading': return colors.statusFading;
      case 'ended': return colors.statusEnded;
      case 'ghosted': return colors.statusGhosted || colors.error;
      default: return colors.textSecondary;
    }
  };

  const renderPerson = ({ item }: { item: Person }) => (
    <Pressable
      style={[
        styles.personItem,
        { backgroundColor: colors.card, borderBottomColor: colors.border }
      ]}
      onPress={() => handleSelect(item)}
    >
      <View style={[styles.personAvatar, { backgroundColor: colors.primary + '20' }]}>
        {item.photos && item.photos.length > 0 ? (
          <Image
            source={{ uri: item.photos[0] }}
            style={styles.personAvatarImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.personInitial, { color: colors.primary }]}>
            {item.name.charAt(0)}
          </Text>
        )}
      </View>
      <View style={styles.personInfo}>
        <View style={styles.personNameRow}>
          <Text style={[styles.personName, { color: colors.text }]}>{item.name}</Text>
          {item.status && (
            <Text style={[styles.personStatus, { color: getStatusColor(item.status) }]}>
              ({item.status})
            </Text>
          )}
        </View>
        {item.lastDate && (
          <Text style={[styles.personMeta, { color: colors.textSecondary }]}>
            Last date: {item.lastDate}
            {item.rating && ` • ${item.rating}/5`}
          </Text>
        )}
      </View>
      {item.id === value && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </Pressable>
  );
  
  return (
    <>
      <Pressable
        style={[
          styles.selector,
          {
            backgroundColor: colors.card,
            borderColor: error ? 'red' : colors.border,
          }
        ]}
        onPress={() => setModalVisible(true)}
      >
        {selectedPerson ? (
          <View style={styles.selectedPersonContainer}>
            <View style={[styles.selectedAvatar, { backgroundColor: colors.primary + '20' }]}>
              {selectedPerson.photos && selectedPerson.photos.length > 0 ? (
                <Image
                  source={{ uri: selectedPerson.photos[0] }}
                  style={styles.selectedAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.selectedInitial, { color: colors.primary }]}>
                  {selectedPerson.name.charAt(0)}
                </Text>
              )}
            </View>
            <Text style={[styles.selectorText, { color: colors.text }]}>
              {selectedPerson.name}
            </Text>
            {selectedPerson.status && (
              <Text style={[styles.selectedStatus, { color: getStatusColor(selectedPerson.status) }]}>
                ({selectedPerson.status})
              </Text>
            )}
          </View>
        ) : (
          <Text style={[styles.selectorText, { color: colors.textSecondary }]}>
            {placeholder}
          </Text>
        )}
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={modalVisible}
        animationType="none"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Person</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: colors.text, backgroundColor: colors.card }
              ]}
              placeholder="Search people..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredPeople}
            renderItem={renderPerson}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery ? 'No people found' : 'No people in your roster'}
                </Text>
              </View>
            }
          />
          
          <View style={[styles.modalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.addNewButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
                if (onAddNew) {
                  onAddNew();
                }
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.addNewText}>Add New Person</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 40,
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  selectedPersonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  selectedAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedInitial: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedStatus: {
    fontSize: 14,
    marginLeft: 4,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  personAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  personInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  personInfo: {
    flex: 1,
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personName: {
    fontSize: 16,
    fontWeight: '500',
  },
  personStatus: {
    fontSize: 14,
    marginLeft: 4,
  },
  personMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addNewText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});