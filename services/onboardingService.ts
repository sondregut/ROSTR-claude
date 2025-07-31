import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEYS } from '@/constants/OnboardingContent';

class OnboardingService {
  // Check if user has seen welcome screens
  async hasSeenWelcome(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEYS.HAS_SEEN_WELCOME);
      return value === 'true';
    } catch (error) {
      console.error('Error checking welcome status:', error);
      return false;
    }
  }

  // Mark welcome screens as seen
  async markWelcomeSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEYS.HAS_SEEN_WELCOME, 'true');
    } catch (error) {
      console.error('Error marking welcome seen:', error);
    }
  }

  // Check if onboarding is complete
  async isOnboardingComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  // Mark onboarding as complete
  async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEYS.ONBOARDING_COMPLETE, 'true');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }

  // Get onboarding progress
  async getProgress(): Promise<{
    hasSeenWelcome: boolean;
    hasCreatedAccount: boolean;
    hasCreatedCircle: boolean;
    hasInvitedFriends: boolean;
    hasAddedRoster: boolean;
    hasSeenCoachMarks: boolean;
  }> {
    try {
      const keys = [
        ONBOARDING_KEYS.HAS_SEEN_WELCOME,
        ONBOARDING_KEYS.HAS_CREATED_ACCOUNT,
        ONBOARDING_KEYS.HAS_CREATED_CIRCLE,
        ONBOARDING_KEYS.HAS_INVITED_FRIENDS,
        ONBOARDING_KEYS.HAS_ADDED_ROSTER,
        ONBOARDING_KEYS.HAS_SEEN_COACH_MARKS,
      ];

      const values = await AsyncStorage.multiGet(keys);
      
      return {
        hasSeenWelcome: values[0][1] === 'true',
        hasCreatedAccount: values[1][1] === 'true',
        hasCreatedCircle: values[2][1] === 'true',
        hasInvitedFriends: values[3][1] === 'true',
        hasAddedRoster: values[4][1] === 'true',
        hasSeenCoachMarks: values[5][1] === 'true',
      };
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      return {
        hasSeenWelcome: false,
        hasCreatedAccount: false,
        hasCreatedCircle: false,
        hasInvitedFriends: false,
        hasAddedRoster: false,
        hasSeenCoachMarks: false,
      };
    }
  }

  // Update specific progress step
  async updateProgress(key: keyof typeof ONBOARDING_KEYS, value: boolean): Promise<void> {
    try {
      const storageKey = ONBOARDING_KEYS[key];
      await AsyncStorage.setItem(storageKey, value.toString());
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
    }
  }

  // Mark circle created
  async markCircleCreated(): Promise<void> {
    await this.updateProgress('HAS_CREATED_CIRCLE', true);
  }

  // Mark friends invited
  async markFriendsInvited(): Promise<void> {
    await this.updateProgress('HAS_INVITED_FRIENDS', true);
  }

  // Mark roster added
  async markRosterAdded(): Promise<void> {
    await this.updateProgress('HAS_ADDED_ROSTER', true);
  }

  // Mark coach marks seen
  async markCoachMarksSeen(): Promise<void> {
    await this.updateProgress('HAS_SEEN_COACH_MARKS', true);
  }

  // Check if should show coach marks
  async shouldShowCoachMarks(): Promise<boolean> {
    try {
      const hasSeenCoachMarks = await AsyncStorage.getItem(ONBOARDING_KEYS.HAS_SEEN_COACH_MARKS);
      const isOnboardingComplete = await this.isOnboardingComplete();
      
      // Show coach marks if onboarding is complete but user hasn't seen them yet
      return isOnboardingComplete && hasSeenCoachMarks !== 'true';
    } catch (error) {
      console.error('Error checking coach marks status:', error);
      return false;
    }
  }

  // Reset onboarding (for testing)
  async resetOnboarding(): Promise<void> {
    try {
      const keys = Object.values(ONBOARDING_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }

  // Get next onboarding step
  async getNextStep(): Promise<string | null> {
    const progress = await this.getProgress();

    if (!progress.hasSeenWelcome) {
      return 'welcome';
    }
    if (!progress.hasCreatedAccount) {
      return 'create-account';
    }
    if (!progress.hasCreatedCircle) {
      return 'create-circle';
    }
    if (!progress.hasAddedRoster) {
      return 'add-roster';
    }
    if (!progress.hasInvitedFriends) {
      return 'invite-friends';
    }
    if (!progress.hasSeenCoachMarks) {
      return 'coach-marks';
    }

    return null; // Onboarding complete
  }
}

export const onboardingService = new OnboardingService();