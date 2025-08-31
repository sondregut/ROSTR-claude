import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/buttons/Button';
import { ContactService, PhoneContact } from '@/services/contacts/ContactService';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { supabase } from '@/lib/supabase';

interface EnhancedContactModalProps {
  visible: boolean;
  onClose: () => void;
  onInvitesSent?: (count: number) => void;
  onFriendsAdded?: (count: number) => void;
  joinCode?: string;
}

interface ContactSection {
  title: string;
  data: PhoneContact[];
}

export function EnhancedContactModal({ 
  visible, 
  onClose, 
  onInvitesSent, 
  onFriendsAdded,
  joinCode 
}: EnhancedContactModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const auth = useSafeAuth();
  const user = auth?.user;

  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [selectedInvites, setSelectedInvites] = useState<Set<string>>(new Set());
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadContacts();
    } else {
      // Reset selections when modal closes
      setSelectedInvites(new Set());
      setSelectedFriends(new Set());
      setSearchQuery('');
    }
  }, [visible]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const contactsWithStatus = await ContactService.getContactsWithStatus();
      
      // Check for mutual contacts (both have each other's numbers)
      const enhancedContacts = await enhanceMutualStatus(contactsWithStatus);
      setContacts(enhancedContacts);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      if (error.message === 'Contacts permission denied') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your contacts to find friends.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('Error', 'Failed to load contacts. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const enhanceMutualStatus = async (contacts: PhoneContact[]) => {
    // Check if users also have current user's phone in their contacts
    // This would require a backend check against contact_phone_hashes table
    // For now, we'll mark as mutual randomly for demo
    return contacts.map(contact => ({
      ...contact,
      isMutual: contact.isRegistered && Math.random() > 0.5, // Demo only
    }));
  };

  const toggleSelection = (contactId: string, isRegistered: boolean) => {
    if (isRegistered) {
      const newSelected = new Set(selectedFriends);
      if (newSelected.has(contactId)) {
        newSelected.delete(contactId);
      } else {
        newSelected.add(contactId);
      }
      setSelectedFriends(newSelected);
    } else {
      const newSelected = new Set(selectedInvites);
      if (newSelected.has(contactId)) {
        newSelected.delete(contactId);
      } else {
        newSelected.add(contactId);
      }
      setSelectedInvites(newSelected);
    }
  };

  const selectAll = (section: 'friends' | 'invites') => {
    if (section === 'friends') {
      const allFriends = new Set(
        contacts
          .filter(c => c.isRegistered)
          .map(c => c.id)
      );
      setSelectedFriends(allFriends);
    } else {
      const allInvites = new Set(
        contacts
          .filter(c => !c.isRegistered)
          .map(c => c.id)
      );
      setSelectedInvites(allInvites);
    }
  };

  const clearAll = () => {
    setSelectedFriends(new Set());
    setSelectedInvites(new Set());
  };

  const processSelections = async () => {
    if (selectedFriends.size === 0 && selectedInvites.size === 0) {
      Alert.alert('No Selection', 'Please select contacts to add or invite.');
      return;
    }

    try {
      setIsProcessing(true);
      let friendsAdded = 0;
      let invitesSent = 0;

      // Add friends who are already on the app
      if (selectedFriends.size > 0) {
        const friendIds = contacts
          .filter(c => selectedFriends.has(c.id) && c.isRegistered && c.userId)
          .map(c => c.userId!);

        // Use the service which handles RLS properly (now sends friend requests)
        const { ContactSyncService } = await import('@/services/contacts/ContactSyncService');
        friendsAdded = await ContactSyncService.sendFriendRequestsToContacts(friendIds);
      }

      // Send invites to non-users
      if (selectedInvites.size > 0) {
        const contactsToInvite = contacts
          .filter(c => selectedInvites.has(c.id) && !c.isRegistered)
          .map(c => ({
            name: c.name,
            phoneNumber: c.phoneNumbers[0]
          }));

        const success = await ContactService.sendInvites(
          contactsToInvite,
          user?.name || 'Your friend',
          user?.id, // Add user ID for referrer deep links
          joinCode
        );

        if (success) {
          invitesSent = contactsToInvite.length;
          
          // Track invites
          for (const contact of contactsToInvite) {
            await ContactService.trackInvite({
              contactId: contacts.find(c => 
                c.phoneNumbers.includes(contact.phoneNumber)
              )?.id || '',
              phoneNumber: contact.phoneNumber,
              name: contact.name,
              invitedAt: new Date().toISOString(),
            });
          }
        }
      }

      // Notify parent components
      if (friendsAdded > 0) onFriendsAdded?.(friendsAdded);
      if (invitesSent > 0) onInvitesSent?.(invitesSent);

      // Show success message
      let message = '';
      if (friendsAdded > 0 && invitesSent > 0) {
        message = `Sent ${friendsAdded} friend request${friendsAdded > 1 ? 's' : ''} and ${invitesSent} invite${invitesSent > 1 ? 's' : ''}!`;
      } else if (friendsAdded > 0) {
        message = `Sent ${friendsAdded} friend request${friendsAdded > 1 ? 's' : ''} successfully!`;
      } else if (invitesSent > 0) {
        message = `Sent ${invitesSent} invite${invitesSent > 1 ? 's' : ''} successfully!`;
      }

      if (message) {
        Alert.alert('Success', message, [{ text: 'OK', onPress: onClose }]);
      }
    } catch (error) {
      console.error('Error processing selections:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections: ContactSection[] = [
    {
      title: 'Friends on RostrDating',
      data: filteredContacts.filter(c => c.isRegistered),
    },
    {
      title: 'Invite to RostrDating',
      data: filteredContacts.filter(c => !c.isRegistered),
    },
  ].filter(section => section.data.length > 0);

  const renderContact = ({ item }: { item: PhoneContact & { isMutual?: boolean } }) => {
    const isSelected = item.isRegistered 
      ? selectedFriends.has(item.id) 
      : selectedInvites.has(item.id);
    
    return (
      <Pressable
        style={[
          styles.contactItem,
          { 
            backgroundColor: isSelected ? colors.primary + '10' : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
        onPress={() => toggleSelection(item.id, item.isRegistered || false)}
      >
        <View style={styles.contactInfo}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.contactAvatar} />
          ) : (
            <View style={[styles.contactAvatarPlaceholder, { backgroundColor: colors.border }]}>
              <Text style={[styles.contactInitial, { color: colors.text }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.contactDetails}>
            <View style={styles.nameRow}>
              <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
              {item.isMutual && (
                <View style={[styles.mutualBadge, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="people" size={12} color={colors.success} />
                  <Text style={[styles.mutualText, { color: colors.success }]}>Mutual</Text>
                </View>
              )}
            </View>
            <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
              {item.phoneNumbers[0]}
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          {item.isRegistered ? (
            <View style={[
              styles.actionButton,
              { backgroundColor: isSelected ? colors.primary : colors.primary + '20' }
            ]}>
              <Text style={[
                styles.actionText,
                { color: isSelected ? 'white' : colors.primary }
              ]}>
                {isSelected ? 'Selected' : 'Send Request'}
              </Text>
            </View>
          ) : (
            <View style={[
              styles.checkbox,
              { 
                borderColor: colors.border,
                backgroundColor: isSelected ? colors.primary : 'transparent',
              }
            ]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: ContactSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      {section.data.length > 0 && (
        <Pressable
          onPress={() => selectAll(
            section.title === 'Friends on RostrDating' ? 'friends' : 'invites'
          )}
          style={[styles.selectAllButton, { backgroundColor: colors.primary + '20' }]}
        >
          <Text style={[styles.selectAllText, { color: colors.primary }]}>
            {section.title === 'Friends on RostrDating' ? 'Add All' : 'Select All'}
          </Text>
        </Pressable>
      )}
    </View>
  );

  const totalSelected = selectedFriends.size + selectedInvites.size;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>Find Friends</Text>
          
          <Pressable 
            onPress={processSelections}
            style={[
              styles.headerButton,
              { opacity: totalSelected > 0 && !isProcessing ? 1 : 0.5 }
            ]}
            disabled={totalSelected === 0 || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.doneText, { color: colors.primary }]}>
                {totalSelected > 0 ? `Done (${totalSelected})` : 'Done'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search contacts..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Selection Summary */}
        {totalSelected > 0 && (
          <View style={[styles.selectionBar, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.selectionText, { color: colors.text }]}>
              {selectedFriends.size > 0 && selectedInvites.size > 0
                ? `${selectedFriends.size} requests to send, ${selectedInvites.size} to invite`
                : selectedFriends.size > 0
                ? `${selectedFriends.size} friend request${selectedFriends.size > 1 ? 's' : ''} to send`
                : `${selectedInvites.size} to invite`
              }
            </Text>
            <Pressable onPress={clearAll}>
              <Text style={[styles.clearText, { color: colors.primary }]}>Clear All</Text>
            </Pressable>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Finding your friends...
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderContact}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  {searchQuery ? 'No contacts found' : 'No contacts available'}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  contactAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  contactDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  mutualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  mutualText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 14,
  },
  actionContainer: {
    marginLeft: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
  },
});