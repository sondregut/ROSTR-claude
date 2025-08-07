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

interface ContactImportModalProps {
  visible: boolean;
  onClose: () => void;
  onInvitesSent?: (count: number) => void;
  joinCode?: string;
}

interface ContactSection {
  title: string;
  data: PhoneContact[];
}

export function ContactImportModal({ visible, onClose, onInvitesSent, joinCode }: ContactImportModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const auth = useSafeAuth();
  const user = auth?.user;

  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const contactsWithStatus = await ContactService.getContactsWithStatus();
      setContacts(contactsWithStatus);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      if (error.message === 'Contacts permission denied') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your contacts to invite friends.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('Error', 'Failed to load contacts. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const selectAll = (registered: boolean) => {
    const newSelected = new Set(selectedContacts);
    contacts
      .filter(c => c.isRegistered === registered)
      .forEach(c => newSelected.add(c.id));
    setSelectedContacts(newSelected);
  };

  const deselectAll = () => {
    setSelectedContacts(new Set());
  };

  const sendInvites = async () => {
    if (selectedContacts.size === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to invite.');
      return;
    }

    try {
      setIsSending(true);
      
      // Get selected contacts that are not registered
      const contactsToInvite = contacts
        .filter(c => selectedContacts.has(c.id) && !c.isRegistered)
        .map(c => ({
          name: c.name,
          phoneNumber: c.phoneNumbers[0] // Use primary phone number
        }));

      if (contactsToInvite.length === 0) {
        Alert.alert('Info', 'All selected contacts are already on RostrDating!');
        return;
      }

      const success = await ContactService.sendInvites(
        contactsToInvite,
        user?.name || 'Your friend',
        joinCode
      );

      if (success) {
        // Track invites
        for (const contact of contactsToInvite) {
          await ContactService.trackInvite({
            contactId: contacts.find(c => c.phoneNumbers.includes(contact.phoneNumber))?.id || '',
            phoneNumber: contact.phoneNumber,
            name: contact.name,
            invitedAt: new Date().toISOString(),
          });
        }

        onInvitesSent?.(contactsToInvite.length);
        Alert.alert(
          'Success',
          `Invites sent to ${contactsToInvite.length} contact${contactsToInvite.length > 1 ? 's' : ''}!`,
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      Alert.alert('Error', 'Failed to send invites. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections: ContactSection[] = [
    {
      title: 'Already on RostrDating',
      data: filteredContacts.filter(c => c.isRegistered),
    },
    {
      title: 'Invite to RostrDating',
      data: filteredContacts.filter(c => !c.isRegistered),
    },
  ].filter(section => section.data.length > 0);

  const renderContact = ({ item }: { item: PhoneContact }) => {
    const isSelected = selectedContacts.has(item.id);
    
    return (
      <Pressable
        style={[
          styles.contactItem,
          { 
            backgroundColor: isSelected ? colors.primary + '10' : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
        onPress={() => !item.isRegistered && toggleContactSelection(item.id)}
        disabled={item.isRegistered}
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
            <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
              {item.phoneNumbers[0]}
            </Text>
          </View>
        </View>

        {item.isRegistered ? (
          <View style={[styles.registeredBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.registeredText, { color: colors.primary }]}>On App</Text>
          </View>
        ) : (
          <View style={styles.checkboxContainer}>
            <View style={[
              styles.checkbox,
              { 
                borderColor: colors.border,
                backgroundColor: isSelected ? colors.primary : 'transparent',
              }
            ]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: ContactSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      {section.title === 'Invite to RostrDating' && section.data.length > 0 && (
        <Pressable
          onPress={() => selectAll(false)}
          style={[styles.selectAllButton, { backgroundColor: colors.primary + '20' }]}
        >
          <Text style={[styles.selectAllText, { color: colors.primary }]}>Select All</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>Import Contacts</Text>
          
          <Pressable 
            onPress={sendInvites}
            style={[
              styles.headerButton,
              { opacity: selectedContacts.size > 0 && !isSending ? 1 : 0.5 }
            ]}
            disabled={selectedContacts.size === 0 || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.inviteText, { color: colors.primary }]}>
                Invite ({selectedContacts.size})
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

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading contacts...</Text>
          </View>
        ) : (
          <>
            {selectedContacts.size > 0 && (
              <View style={[styles.selectionBar, { backgroundColor: colors.primary + '10' }]}>
                <Text style={[styles.selectionText, { color: colors.text }]}>
                  {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
                </Text>
                <Pressable onPress={deselectAll}>
                  <Text style={[styles.deselectText, { color: colors.primary }]}>Deselect All</Text>
                </Pressable>
              </View>
            )}

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
          </>
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
    minWidth: 80,
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
  inviteText: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
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
  deselectText: {
    fontSize: 14,
    fontWeight: '600',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  registeredBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  registeredText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxContainer: {
    padding: 4,
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