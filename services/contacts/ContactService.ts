import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { Platform } from 'react-native';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { supabase } from '@/lib/supabase';

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumbers: string[];
  imageUri?: string;
  isRegistered?: boolean;
  userId?: string;
}

export interface InviteData {
  contactId: string;
  phoneNumber: string;
  name: string;
  invitedAt: string;
}

export class ContactService {
  /**
   * Request permission to access contacts
   */
  static async requestContactsPermission(): Promise<boolean> {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Check if we have permission to access contacts
   */
  static async hasContactsPermission(): Promise<boolean> {
    const { status } = await Contacts.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Fetch all contacts from the device
   */
  static async fetchContacts(): Promise<PhoneContact[]> {
    try {
      const hasPermission = await this.hasContactsPermission();
      if (!hasPermission) {
        const granted = await this.requestContactsPermission();
        if (!granted) {
          throw new Error('Contacts permission denied');
        }
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
        ],
      });

      if (!data || data.length === 0) {
        return [];
      }

      // Transform contacts to our format
      const phoneContacts: PhoneContact[] = data
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map(contact => ({
          id: contact.id,
          name: contact.name || 'Unknown',
          phoneNumbers: contact.phoneNumbers?.map(p => this.normalizePhoneNumber(p.number || '')) || [],
          imageUri: contact.image?.uri,
        }));

      return phoneContacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * Normalize phone number to E.164 format
   * @param phoneNumber The phone number to normalize
   * @param defaultCountry Optional ISO country code (e.g., 'US', 'GB') to use as default
   */
  static normalizePhoneNumber(phoneNumber: string, defaultCountry?: string): string {
    try {
      // Remove all non-numeric characters except +
      const cleaned = phoneNumber.replace(/[^\d+]/g, '');
      
      // Try to parse with country code detection
      if (isValidPhoneNumber(cleaned)) {
        const parsed = parsePhoneNumber(cleaned);
        return parsed.format('E.164');
      }
      
      // If no country code, try with provided default country
      if (!cleaned.startsWith('+') && defaultCountry) {
        try {
          const parsed = parsePhoneNumber(cleaned, defaultCountry as any);
          if (parsed && parsed.isValid()) {
            return parsed.format('E.164');
          }
        } catch (e) {
          // Fall through to US default
        }
      }
      
      // If no country code and no default provided, try with US as fallback
      if (!cleaned.startsWith('+')) {
        const withUS = `+1${cleaned}`;
        if (isValidPhoneNumber(withUS)) {
          const parsed = parsePhoneNumber(withUS);
          return parsed.format('E.164');
        }
      }
      
      return cleaned;
    } catch (error) {
      console.error('Error normalizing phone number:', phoneNumber, error);
      return phoneNumber;
    }
  }

  /**
   * Check which contacts are already registered users
   */
  static async checkRegisteredContacts(phoneNumbers: string[]): Promise<Map<string, string>> {
    try {
      // Batch check phone numbers against users table
      const { data, error } = await supabase
        .from('users')
        .select('id, phone')
        .in('phone', phoneNumbers);

      if (error) throw error;

      // Create a map of phone number to user ID
      const registeredMap = new Map<string, string>();
      data?.forEach(user => {
        if (user.phone) {
          registeredMap.set(user.phone, user.id);
        }
      });

      return registeredMap;
    } catch (error) {
      console.error('Error checking registered contacts:', error);
      return new Map();
    }
  }

  /**
   * Get contacts with registration status
   */
  static async getContactsWithStatus(): Promise<PhoneContact[]> {
    const contacts = await this.fetchContacts();
    
    // Extract all unique phone numbers
    const allPhoneNumbers = new Set<string>();
    contacts.forEach(contact => {
      contact.phoneNumbers.forEach(phone => allPhoneNumbers.add(phone));
    });

    // Check which numbers are registered
    const registeredMap = await this.checkRegisteredContacts(Array.from(allPhoneNumbers));

    // Update contacts with registration status
    return contacts.map(contact => {
      const registeredPhone = contact.phoneNumbers.find(phone => registeredMap.has(phone));
      return {
        ...contact,
        isRegistered: !!registeredPhone,
        userId: registeredPhone ? registeredMap.get(registeredPhone) : undefined,
      };
    });
  }

  /**
   * Send SMS invite to multiple contacts with personalized deep links for auto-friend connection
   */
  static async sendInvites(
    contacts: Array<{ name: string; phoneNumber: string }>,
    inviterName: string,
    senderId?: string,
    joinCode?: string
  ): Promise<boolean> {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('SMS is not available on this device');
      }

      // Send individual SMS to each contact with personalized deep link
      const results = await Promise.allSettled(
        contacts.map(async (contact) => {
          let message = `Hey ${contact.name.split(' ')[0]}! ${inviterName} invited you to join RostrDating - a fun way to track and share your dating life with friends. `;
          
          if (joinCode) {
            message += `\n\nUse this code to join their circle: ${joinCode}`;
          }
          
          // Create personalized deep link for auto-friend connection
          if (senderId) {
            const phoneHash = this.normalizePhoneNumber(contact.phoneNumber);
            const inviteLink = `https://rostrdating.com?ref=${senderId}&phone=${phoneHash}`;
            message += `\n\nJoin me: ${inviteLink}`;
          } else {
            message += `\n\nDownload the app: https://rostrdating.com`;
          }

          const { result } = await SMS.sendSMSAsync([contact.phoneNumber], message);
          return result === 'sent';
        })
      );

      // Return true if all SMS were sent successfully
      return results.every(result => result.status === 'fulfilled' && result.value === true);
    } catch (error) {
      console.error('Error sending invites:', error);
      throw error;
    }
  }

  /**
   * Send single SMS invite
   */
  static async sendSingleInvite(
    phoneNumber: string,
    contactName: string,
    inviterName: string,
    joinCode?: string
  ): Promise<boolean> {
    return this.sendInvites([{ name: contactName, phoneNumber }], inviterName, joinCode);
  }

  /**
   * Store invite tracking data locally
   */
  static async trackInvite(inviteData: InviteData): Promise<void> {
    try {
      // Store in AsyncStorage or local database
      // This is a placeholder - implement based on your local storage strategy
      console.log('Tracking invite:', inviteData);
    } catch (error) {
      console.error('Error tracking invite:', error);
    }
  }

  /**
   * Get tracked invites
   */
  static async getTrackedInvites(): Promise<InviteData[]> {
    try {
      // Retrieve from AsyncStorage or local database
      // This is a placeholder - implement based on your local storage strategy
      return [];
    } catch (error) {
      console.error('Error getting tracked invites:', error);
      return [];
    }
  }
}