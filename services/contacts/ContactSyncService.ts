import AsyncStorage from '@react-native-async-storage/async-storage';
import { createHash } from 'crypto';
import { ContactService, PhoneContact } from './ContactService';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/services/notifications/NotificationService';

interface ContactHash {
  phone_hash: string;
  contact_name: string;
}

interface ContactMatch {
  matched_user_id: string;
  matched_user_name: string;
  matched_user_username: string;
  matched_user_image: string;
  is_friend: boolean;
  is_mutual_contact: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  matchedCount?: number;
  newMatches?: ContactMatch[];
}

const CONTACT_SYNC_KEY = '@contact_sync_status';
const LAST_SYNC_KEY = '@last_contact_sync';

export class ContactSyncService {
  /**
   * Hash a phone number using SHA256 for privacy
   */
  static hashPhoneNumber(phoneNumber: string): string {
    // In React Native, we'll use a simple implementation
    // In production, use a proper crypto library
    return Buffer.from(phoneNumber).toString('base64');
  }

  /**
   * Check if user has previously synced contacts
   */
  static async hasSyncedContacts(): Promise<boolean> {
    try {
      const status = await AsyncStorage.getItem(CONTACT_SYNC_KEY);
      return status === 'synced';
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Sync user's contacts with the backend
   */
  static async syncContacts(userId: string): Promise<SyncResult> {
    try {
      // Get permission and fetch contacts
      const hasPermission = await ContactService.hasContactsPermission();
      if (!hasPermission) {
        const granted = await ContactService.requestContactsPermission();
        if (!granted) {
          return { 
            success: false, 
            message: 'Contact permission is required to find friends' 
          };
        }
      }

      // Fetch all contacts
      const contacts = await ContactService.fetchContacts();
      if (contacts.length === 0) {
        return { 
          success: false, 
          message: 'No contacts found on device' 
        };
      }

      // Prepare hashed phone numbers
      const contactHashes: ContactHash[] = [];
      const processedNumbers = new Set<string>();

      contacts.forEach(contact => {
        contact.phoneNumbers.forEach(phoneNumber => {
          const normalized = ContactService.normalizePhoneNumber(phoneNumber);
          if (normalized && !processedNumbers.has(normalized)) {
            processedNumbers.add(normalized);
            contactHashes.push({
              phone_hash: this.hashPhoneNumber(normalized),
              contact_name: contact.name,
            });
          }
        });
      });

      // Delete existing contact hashes for this user
      const { error: deleteError } = await supabase
        .from('contact_phone_hashes')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error clearing old contact hashes:', deleteError);
      }

      // Upload hashed contacts to backend
      const { error: uploadError } = await supabase
        .from('contact_phone_hashes')
        .insert(
          contactHashes.map(hash => ({
            user_id: userId,
            ...hash,
          }))
        );

      if (uploadError) {
        console.error('Error uploading contact hashes:', uploadError);
        return { 
          success: false, 
          message: 'Failed to sync contacts' 
        };
      }

      // Create or update sync record
      const { error: syncError } = await supabase
        .from('contact_syncs')
        .upsert({
          user_id: userId,
          contact_count: contactHashes.length,
          sync_hash: this.generateSyncHash(contactHashes),
          synced_at: new Date().toISOString(),
        });

      if (syncError) {
        console.error('Error updating sync record:', syncError);
      }

      // Trigger match finding on backend
      const { error: matchError } = await supabase.rpc('sync_contact_matches', {
        p_user_id: userId,
      });

      if (matchError) {
        console.error('Error finding matches:', matchError);
      }

      // Get the matches
      const matches = await this.getContactMatches(userId);

      // Update local storage
      await AsyncStorage.setItem(CONTACT_SYNC_KEY, 'synced');
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      return { 
        success: true, 
        message: `Found ${matches.length} friends from your contacts!`,
        matchedCount: matches.length,
        newMatches: matches,
      };
    } catch (error) {
      console.error('Error syncing contacts:', error);
      return { 
        success: false, 
        message: 'An error occurred while syncing contacts' 
      };
    }
  }

  /**
   * Get contact matches for a user with friendship status
   */
  static async getContactMatches(userId: string): Promise<ContactMatch[]> {
    try {
      const { data, error } = await supabase.rpc('find_contact_matches', {
        p_user_id: userId,
      });

      if (error) throw error;

      // Get current friendships to check status
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      const friendIds = new Set(friendships?.map(f => f.friend_id) || []);

      // Enhance matches with friendship status
      return (data || []).map((match: any) => ({
        ...match,
        is_friend: friendIds.has(match.matched_user_id)
      }));
    } catch (error) {
      console.error('Error getting contact matches:', error);
      return [];
    }
  }

  /**
   * Check if two users have each other in contacts (bidirectional match)
   */
  static async checkMutualContact(userId: string, otherUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('contact_matches')
        .select('is_mutual')
        .eq('user_id', userId)
        .eq('matched_user_id', otherUserId)
        .single();

      if (error) return false;

      return data?.is_mutual || false;
    } catch (error) {
      console.error('Error checking mutual contact:', error);
      return false;
    }
  }

  /**
   * Send friend requests to contacts
   */
  static async sendFriendRequestsToContacts(friendIds: string[]): Promise<number> {
    try {
      let requestsSent = 0;

      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return 0;
      }

      // Get user details for notifications
      const { data: senderDetails } = await supabase
        .from('users')
        .select('name, username')
        .eq('id', user.id)
        .single();

      for (const friendId of friendIds) {
        try {
          // Check if any relationship already exists
          const { data: existing } = await supabase
            .from('friendships')
            .select('status')
            .eq('user_id', user.id)
            .eq('friend_id', friendId)
            .single();

          if (!existing) {
            // Create pending friend request - RLS will automatically set user_id to auth.uid()
            const { error: friendError } = await supabase
              .from('friendships')
              .upsert({
                user_id: user.id, // This must match auth.uid() for RLS
                friend_id: friendId,
                status: 'pending',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,friend_id'
              });

            if (!friendError) {
              requestsSent++;
              
              // Send notification to recipient
              if (senderDetails) {
                await notificationService.createNotification({
                  user_id: friendId,
                  type: 'friend_request',
                  title: 'Friend Request',
                  body: `${senderDetails.name} wants to be your friend`,
                  data: { 
                    senderId: user.id, 
                    senderName: senderDetails.name,
                    senderUsername: senderDetails.username 
                  },
                  read: false
                });
              }
            } else {
              console.error(`RLS Error sending friend request to ${friendId}:`, friendError);
            }
          } else if (existing.status === 'pending') {
            // Request already sent, count as success
            requestsSent++;
          } else if (existing.status === 'active') {
            // Already friends, count as success
            requestsSent++;
          }
        } catch (error) {
          console.error(`Error sending friend request to ${friendId}:`, error);
        }
      }

      return requestsSent;
    } catch (error) {
      console.error('Error sending friend requests to contacts:', error);
      return 0;
    }
  }

  /**
   * @deprecated Use sendFriendRequestsToContacts instead
   */
  static async addFriendsFromContacts(friendIds: string[]): Promise<number> {
    return this.sendFriendRequestsToContacts(friendIds);
  }

  /**
   * Clear synced contacts and remove from backend
   */
  static async clearSyncedContacts(userId: string): Promise<boolean> {
    try {
      // Delete contact hashes
      const { error: deleteHashesError } = await supabase
        .from('contact_phone_hashes')
        .delete()
        .eq('user_id', userId);

      if (deleteHashesError) throw deleteHashesError;

      // Delete contact matches
      const { error: deleteMatchesError } = await supabase
        .from('contact_matches')
        .delete()
        .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);

      if (deleteMatchesError) throw deleteMatchesError;

      // Delete sync record
      const { error: deleteSyncError } = await supabase
        .from('contact_syncs')
        .delete()
        .eq('user_id', userId);

      if (deleteSyncError) throw deleteSyncError;

      // Clear local storage
      await AsyncStorage.removeItem(CONTACT_SYNC_KEY);
      await AsyncStorage.removeItem(LAST_SYNC_KEY);

      return true;
    } catch (error) {
      console.error('Error clearing synced contacts:', error);
      return false;
    }
  }

  /**
   * Generate a hash of the contact list to detect changes
   */
  private static generateSyncHash(contactHashes: ContactHash[]): string {
    const sorted = contactHashes
      .map(c => c.phone_hash)
      .sort()
      .join(',');
    return Buffer.from(sorted).toString('base64').substring(0, 32);
  }

  /**
   * Get users from contacts who aren't on the app yet
   */
  static async getInvitableContacts(userId: string): Promise<PhoneContact[]> {
    try {
      // Get all contacts
      const allContacts = await ContactService.fetchContacts();
      
      // Get registered users from contacts
      const registeredPhones = new Set<string>();
      const allPhones = new Set<string>();

      allContacts.forEach(contact => {
        contact.phoneNumbers.forEach(phone => {
          const normalized = ContactService.normalizePhoneNumber(phone);
          if (normalized) {
            allPhones.add(normalized);
          }
        });
      });

      // Check which phones are registered
      const { data: registeredUsers } = await supabase
        .from('users')
        .select('phone')
        .in('phone', Array.from(allPhones))
        .not('phone', 'is', null);

      registeredUsers?.forEach(user => {
        if (user.phone) {
          registeredPhones.add(user.phone);
        }
      });

      // Filter to only non-registered contacts
      return allContacts.filter(contact => {
        return contact.phoneNumbers.some(phone => {
          const normalized = ContactService.normalizePhoneNumber(phone);
          return normalized && !registeredPhones.has(normalized);
        });
      });
    } catch (error) {
      console.error('Error getting invitable contacts:', error);
      return [];
    }
  }
}