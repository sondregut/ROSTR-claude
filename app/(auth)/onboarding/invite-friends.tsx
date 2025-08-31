import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/buttons/Button';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { PERMISSION_MESSAGES } from '@/constants/OnboardingContent';
import { ContactSyncService } from '@/services/contacts/ContactSyncService';
import { ContactMatchCard } from '@/components/ui/cards/ContactMatchCard';
import { FriendRequestService } from '@/services/FriendRequestService';
import { useSafeAuth } from '@/hooks/useSafeAuth';

interface ContactMatch {
  matched_user_id: string;
  matched_user_name: string;
  matched_user_username: string;
  matched_user_image: string;
  is_friend: boolean;
  is_mutual_contact: boolean;
}

interface InvitableContact {
  id: string;
  name: string;
  phoneNumber: string;
}

export default function InviteFriendsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { markFriendsInvited } = useOnboardingState();
  const auth = useSafeAuth();
  
  const [contactMatches, setContactMatches] = useState<ContactMatch[]>([]);
  const [invitableContacts, setInvitableContacts] = useState<InvitableContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  // SMS invite state management
  const [pendingInvites, setPendingInvites] = useState<Set<string>>(new Set());
  const [completedInvites, setCompletedInvites] = useState<Set<string>>(new Set());
  const [smsQueue, setSmsQueue] = useState<InvitableContact[]>([]);
  const [isProcessingSms, setIsProcessingSms] = useState(false);
  const [lastInviteTime, setLastInviteTime] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    requestContactsPermission();
  }, []);

  // Process SMS queue one at a time
  useEffect(() => {
    if (smsQueue.length > 0 && !isProcessingSms) {
      processSmsQueue();
    }
  }, [smsQueue, isProcessingSms]);

  const processSmsQueue = async () => {
    if (smsQueue.length === 0 || isProcessingSms) return;

    setIsProcessingSms(true);
    const contact = smsQueue[0];

    try {
      // Remove from queue first
      setSmsQueue(prev => prev.slice(1));
      
      // Create phone-specific deep link
      const userId = auth?.user?.id || '';
      const phoneHash = contact.phoneNumber;
      const inviteLink = `https://rostrdating.com?ref=${userId}&phone=${phoneHash}`;
      
      const message = `Hey ${contact.name}! I'm on RostrDating and thought you'd like it. Join me: ${inviteLink}`;
      
      // Try to send SMS with timeout
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await Promise.race([
          SMS.sendSMSAsync([contact.phoneNumber], message),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SMS timeout')), 10000) // 10 second timeout
          )
        ]);
        
        // Mark as completed
        setCompletedInvites(prev => new Set(prev).add(contact.id));
        setPendingInvites(prev => {
          const newSet = new Set(prev);
          newSet.delete(contact.id);
          return newSet;
        });
        
        console.log(`✅ SMS sent successfully to ${contact.name}`);
      } else {
        throw new Error('SMS not available');
      }
    } catch (error) {
      console.error(`❌ SMS failed for ${contact.name}:`, error);
      
      // Remove from pending
      setPendingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(contact.id);
        return newSet;
      });
      
      // Show fallback dialog
      Alert.alert(
        'SMS Failed', 
        `Couldn't send SMS to ${contact.name}. Please copy this message and send it manually:\n\n${message.substring(0, 100)}...`,
        [{ text: 'OK' }]
      );
    } finally {
      // Wait before processing next item to avoid rate limiting
      setTimeout(() => {
        setIsProcessingSms(false);
      }, 1000);
    }
  };

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        syncAndLoadContacts();
      } else {
        setPermissionDenied(true);
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setPermissionDenied(true);
    }
  };

  const syncAndLoadContacts = async () => {
    if (!auth?.user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setIsSyncing(true);
      
      // First sync contacts to find matches
      const syncResult = await ContactSyncService.syncContacts(auth.user.id);
      
      if (!syncResult.success) {
        Alert.alert('Sync Failed', syncResult.message);
        setIsLoading(false);
        return;
      }

      // Load contact matches (existing RostrDating users)
      const matches = await ContactSyncService.getContactMatches(auth.user.id);
      setContactMatches(matches);

      // Load invitable contacts (not on RostrDating yet)
      const invitables = await ContactSyncService.getInvitableContacts(auth.user.id);
      const formattedInvitables = invitables.map(contact => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumbers[0] || '', // Take first phone number
      }));
      setInvitableContacts(formattedInvitables.slice(0, 20)); // Limit to 20 for performance

      console.log(`📱 Found ${matches.length} friends already on RostrDating`);
      console.log(`📮 Found ${formattedInvitables.length} contacts to invite`);
      
    } catch (error) {
      console.error('Error syncing contacts:', error);
      Alert.alert('Error', 'Failed to sync contacts. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const handleAddFriend = async (match: ContactMatch) => {
    try {
      const success = await FriendRequestService.sendFriendRequest(match.matched_user_id);
      
      if (success) {
        Alert.alert(
          'Friend Request Sent!',
          `Your friend request has been sent to ${match.matched_user_name}`,
          [{ text: 'Great!' }]
        );
        
        // Update the UI to reflect the change
        setContactMatches(prev => prev.map(c => 
          c.matched_user_id === match.matched_user_id 
            ? { ...c, is_friend: true }  
            : c
        ));
      } else {
        Alert.alert('Error', 'Failed to send friend request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleInviteContact = (contact: InvitableContact) => {
    const now = Date.now();
    const lastTime = lastInviteTime[contact.id] || 0;
    
    // Debounce rapid taps (300ms minimum between attempts)
    if (now - lastTime < 300) {
      console.log(`🚫 Debounced rapid tap for ${contact.name}`);
      return;
    }
    
    // Prevent double-invites and rapid tapping
    if (pendingInvites.has(contact.id) || completedInvites.has(contact.id)) {
      return;
    }

    // Update last invite time
    setLastInviteTime(prev => ({ ...prev, [contact.id]: now }));
    
    // Add to pending immediately to prevent duplicate requests
    setPendingInvites(prev => new Set(prev).add(contact.id));
    
    // Add to SMS queue for sequential processing
    setSmsQueue(prev => [...prev, contact]);
    
    console.log(`📱 Added ${contact.name} to SMS invite queue`);
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

      const userId = auth?.user?.id || '';
      const userName = auth?.user?.name || 'Your friend';
      const referralUrl = `https://rostrdating.com?ref=${userId}&invited_by=${encodeURIComponent(userName)}`;
      const message = `Hey! I'm trying out this new app called RostrDating for tracking dating life and getting advice from friends. Join my circle so we can dish! Download: ${referralUrl}`;

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

  const renderContactMatch = ({ item }: { item: ContactMatch }) => (
    <ContactMatchCard
      id={item.matched_user_id}
      name={item.matched_user_name}
      username={item.matched_user_username}
      imageUri={item.matched_user_image}
      isFriend={item.is_friend}
      isMutualContact={item.is_mutual_contact}
      onPress={() => console.log('View profile:', item.matched_user_name)}
      onAddFriend={item.is_friend ? undefined : () => handleAddFriend(item)}
    />
  );

  const renderInvitableContact = ({ item }: { item: InvitableContact }) => {
    const isPending = pendingInvites.has(item.id);
    const isCompleted = completedInvites.has(item.id);
    const isDisabled = isPending || isCompleted || isProcessingSms;

    return (
      <Pressable
        style={[
          styles.contactItem,
          { backgroundColor: colors.card, borderColor: colors.border },
          isDisabled && { opacity: 0.7 }
        ]}
        onPress={() => !isDisabled && handleInviteContact(item)}
        disabled={isDisabled}
      >
        <View style={styles.contactInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.contactDetails}>
            <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
              {isPending ? 'Sending invite...' : 
               isCompleted ? 'Invite sent!' : 
               'Not on RostrDating yet'}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.inviteButton, 
          { backgroundColor: isCompleted ? colors.success || '#22C55E' : colors.primary },
          isPending && { backgroundColor: colors.textSecondary }
        ]}>
          {isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : isCompleted ? (
            <Ionicons name="checkmark" size={16} color="white" />
          ) : (
            <Text style={styles.inviteButtonText}>Invite</Text>
          )}
        </View>
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
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Step 2 of 3</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="people-outline" size={48} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Invite Your Friends</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              ROSTR is better with friends. Select who you want in your circle.
            </Text>
          </View>

          {/* Search Bar */}
          {!permissionDenied && (contactMatches.length > 0 || invitableContacts.length > 0) && false && (
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search contacts..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          )}

          {/* Contact Count */}
          {!permissionDenied && false && (
            <View style={styles.contactCount}>
              <Text style={[styles.contactCountText, { color: colors.textSecondary }]}>
                {searchQuery 
                  ? `${filteredContacts.length} contacts found` 
                  : `Showing ${contactsLoaded} of ${totalContacts} contacts`
                }
              </Text>
            </View>
          )}

          {/* Contacts list or permission denied */}
          {permissionDenied ? (
            <View style={styles.permissionDenied}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.permissionTitle, { color: colors.text }]}>Contacts Access Needed</Text>
              <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
                {PERMISSION_MESSAGES.contacts.message}
              </Text>
              <Button onPress={requestContactsPermission} style={styles.permissionButton}>
                Grant Access
              </Button>
            </View>
          ) : (
            <ScrollView style={styles.contactsContainer} showsVerticalScrollIndicator={false}>
              {/* Status */}
              {isSyncing && (
                <View style={styles.syncingContainer}>
                  <Text style={[styles.syncingText, { color: colors.textSecondary }]}>
                    📱 Syncing contacts...
                  </Text>
                </View>
              )}

              {/* Friends already on RostrDating */}
              {contactMatches.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Friends on RostrDating ({contactMatches.length})
                  </Text>
                  {contactMatches.map((item) => (
                    <View key={item.matched_user_id} style={{ marginBottom: 8 }}>
                      {renderContactMatch({ item })}
                    </View>
                  ))}
                </View>
              )}

              {/* Contacts to invite */}
              {invitableContacts.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Invite to RostrDating ({invitableContacts.length})
                  </Text>
                  {invitableContacts.map((item) => (
                    <View key={item.id}>
                      {renderInvitableContact({ item })}
                    </View>
                  ))}
                </View>
              )}

              {/* Loading state */}
              {isLoading && (
                <View style={styles.loadingState}>
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading contacts...
                  </Text>
                </View>
              )}

              {/* Empty state */}
              {!isLoading && !isSyncing && contactMatches.length === 0 && invitableContacts.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No contacts found
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Make sure you have contacts saved with phone numbers
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            onPress={handleSkip}
            style={styles.continueButton}
          >
            Continue
          </Button>

          {!isSyncing && !permissionDenied && (contactMatches.length > 0 || invitableContacts.length > 0) && (
            <Pressable onPress={syncAndLoadContacts} style={styles.refreshButton}>
              <Text style={[styles.refreshText, { color: colors.primary }]}>🔄 Refresh Contacts</Text>
            </Pressable>
          )}
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
    backgroundColor: '#F07A7A', // Use consistent primary color
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
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
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  contactCount: {
    paddingHorizontal: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  contactCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactsList: {
    paddingHorizontal: 20,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactItemSelected: {
    // Dynamic colors applied inline
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
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
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
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
  },
  actions: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 16,
  },
  inviteButton: {
    paddingVertical: 16,
    borderRadius: 30,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
  },
  contactsContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  syncingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  syncingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  contactDetails: {
    flex: 1,
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 30,
  },
  refreshButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '500',
  },
});