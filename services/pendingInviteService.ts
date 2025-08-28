import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INVITE_KEY = '@pending_circle_invite';

export interface PendingInvite {
  circleId: string;
  inviterName?: string;
  timestamp: number;
}

export class PendingInviteService {
  /**
   * Store a pending circle invite for after sign-in
   */
  static async storePendingInvite(circleId: string, inviterName?: string): Promise<void> {
    try {
      const invite: PendingInvite = {
        circleId,
        inviterName,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite));
      console.log('Stored pending invite:', invite);
    } catch (error) {
      console.error('Error storing pending invite:', error);
    }
  }

  /**
   * Retrieve and clear pending invite
   */
  static async getPendingInvite(): Promise<PendingInvite | null> {
    try {
      const inviteData = await AsyncStorage.getItem(PENDING_INVITE_KEY);
      if (!inviteData) {
        return null;
      }

      const invite: PendingInvite = JSON.parse(inviteData);
      
      // Check if invite is still valid (less than 7 days old)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (invite.timestamp < sevenDaysAgo) {
        await this.clearPendingInvite();
        return null;
      }

      return invite;
    } catch (error) {
      console.error('Error retrieving pending invite:', error);
      return null;
    }
  }

  /**
   * Clear pending invite after it's been processed
   */
  static async clearPendingInvite(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PENDING_INVITE_KEY);
      console.log('Cleared pending invite');
    } catch (error) {
      console.error('Error clearing pending invite:', error);
    }
  }

  /**
   * Check if there's a pending invite
   */
  static async hasPendingInvite(): Promise<boolean> {
    try {
      const invite = await this.getPendingInvite();
      return invite !== null;
    } catch (error) {
      console.error('Error checking pending invite:', error);
      return false;
    }
  }
}