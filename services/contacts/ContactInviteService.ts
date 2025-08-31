import { supabase } from '@/lib/supabase';
import * as SMS from 'expo-sms';
import { Alert, Linking } from 'react-native';

export interface PendingInvite {
  id: string;
  sender_id: string;
  phone_number: string;
  message: string;
  created_at: string;
  expires_at: string;
}

export class ContactInviteService {
  /**
   * Send SMS invite to a phone number
   */
  static async sendSMSInvite(
    senderId: string, 
    phoneNumber: string, 
    senderName: string,
    customMessage?: string
  ): Promise<boolean> {
    try {
      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        // Fallback to share sheet with pre-filled message
        const message = customMessage || 
          `Hey! I'm on RostrDating and thought you'd like it. Join me: https://rostrdating.com?ref=${senderId}`;
        
        await Linking.openURL(`sms:${phoneNumber}&body=${encodeURIComponent(message)}`);
        return true;
      }

      // Send SMS using Expo SMS
      const message = customMessage || 
        `Hey! ${senderName} invited you to join RostrDating. Download: https://rostrdating.com?ref=${senderId}`;

      const { result } = await SMS.sendSMSAsync([phoneNumber], message);
      
      if (result === SMS.SMSResult.sent) {
        // Store pending invite in database
        await this.storePendingInvite(senderId, phoneNumber, message);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending SMS invite:', error);
      
      // Fallback: Open SMS app with pre-filled message
      try {
        const message = customMessage || 
          `Hey! I'm on RostrDating and thought you'd like it. Join me: https://rostrdating.com?ref=${senderId}`;
        
        await Linking.openURL(`sms:${phoneNumber}&body=${encodeURIComponent(message)}`);
        return true;
      } catch (fallbackError) {
        console.error('SMS fallback failed:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Store pending invite in database
   */
  private static async storePendingInvite(
    senderId: string, 
    phoneNumber: string, 
    message: string
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expire after 30 days

      await supabase
        .from('pending_invites')
        .insert({
          sender_id: senderId,
          phone_number: phoneNumber,
          message,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Error storing pending invite:', error);
    }
  }

  /**
   * Send bulk invites to multiple contacts
   */
  static async sendBulkInvites(
    senderId: string,
    senderName: string,
    contacts: Array<{ name: string; phoneNumber: string }>,
    customMessage?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process invites in batches to avoid overwhelming the SMS system
    const batchSize = 5;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      const promises = batch.map(async (contact) => {
        try {
          const sent = await this.sendSMSInvite(
            senderId, 
            contact.phoneNumber, 
            senderName,
            customMessage
          );
          
          if (sent) {
            success++;
          } else {
            failed++;
            errors.push(`Failed to send invite to ${contact.name}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Error sending invite to ${contact.name}: ${error}`);
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success, failed, errors };
  }

  /**
   * Generate invite link for sharing
   */
  static generateInviteLink(userId: string, username?: string): string {
    const baseUrl = 'https://rostrdating.com';
    const params = new URLSearchParams({
      ref: userId,
      ...(username && { invited_by: username })
    });
    
    return `${baseUrl}?${params.toString()}`;
  }
}