import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { PERMISSION_MESSAGES } from '@/constants/OnboardingContent';

interface Contact {
  id: string;
  name: string;
  phoneNumber?: string;
  selected: boolean;
}

export default function InviteFriendsScreen() {
  const router = useRouter();
  const { markFriendsInvited } = useOnboardingState();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    requestContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        loadContacts();
      } else {
        setPermissionDenied(true);
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setPermissionDenied(true);
    }
  };

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });

      if (data.length > 0) {
        const formattedContacts: Contact[] = data
          .filter(contact => contact.name && contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .slice(0, 50) // Limit to first 50 contacts for performance
          .map(contact => ({
            id: contact.id || Math.random().toString(),
            name: contact.name || '',
            phoneNumber: contact.phoneNumbers?.[0]?.number,
            selected: false,
          }));

        setContacts(formattedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const sendInvites = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one friend to invite.');
      return;
    }

    try {
      const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
      const phoneNumbers = selectedContactsData
        .map(c => c.phoneNumber)
        .filter(Boolean) as string[];

      const message = `Hey! I'm trying out this new app called ROSTR for tracking dating life and getting advice from friends. Join my circle so we can dish! Download: https://rostr.app`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(phoneNumbers, message);
        
        // Mark as completed
        await markFriendsInvited();
        
        // Navigate to next step
        router.push('/(auth)/onboarding/add-first-roster');
      } else {
        Alert.alert('SMS Not Available', 'SMS is not available on this device.');
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      Alert.alert('Error', 'Failed to send invites. Please try again.');
    }
  };

  const handleSkip = async () => {
    await markFriendsInvited();
    router.push('/(auth)/onboarding/add-first-roster');
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.includes(item.id);
    
    return (
      <Pressable
        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
        onPress={() => toggleContact(item.id)}
      >
        <View style={styles.contactInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
          </View>
        </View>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'circle-outline'}
          size={24}
          color={isSelected ? '#FE5268' : '#999'}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF8F3', '#FFE0CC']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 3</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="people-outline" size={48} color="#FE5268" />
            <Text style={styles.title}>Invite Your Friends</Text>
            <Text style={styles.description}>
              ROSTR is better with friends. Select who you want in your circle.
            </Text>
          </View>

          {/* Contacts list or permission denied */}
          {permissionDenied ? (
            <View style={styles.permissionDenied}>
              <Ionicons name="people-outline" size={64} color="#999" />
              <Text style={styles.permissionTitle}>Contacts Access Needed</Text>
              <Text style={styles.permissionText}>
                {PERMISSION_MESSAGES.contacts.message}
              </Text>
              <Button onPress={requestContactsPermission} style={styles.permissionButton}>
                Grant Access
              </Button>
            </View>
          ) : (
            <FlatList
              data={contacts}
              renderItem={renderContact}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.contactsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {isLoading ? 'Loading contacts...' : 'No contacts found'}
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            onPress={sendInvites}
            disabled={selectedContacts.length === 0 || permissionDenied}
            style={styles.inviteButton}
          >
            Send Invites ({selectedContacts.length})
          </Button>

          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for Now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 40,
    paddingTop: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE5268',
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  contactsList: {
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  contactItemSelected: {
    borderColor: '#FE5268',
    backgroundColor: '#FFF5F6',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE0CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FE5268',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  actions: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 16,
  },
  inviteButton: {
    backgroundColor: '#FE5268',
    paddingVertical: 16,
    borderRadius: 30,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#666',
  },
});