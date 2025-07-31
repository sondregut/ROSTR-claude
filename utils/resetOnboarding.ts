// Temporary utility to reset onboarding for testing
// You can call this from the app to reset onboarding state

import { onboardingService } from '@/services/onboardingService';

export const resetOnboardingForTesting = async () => {
  try {
    await onboardingService.resetOnboarding();
    console.log('✅ Onboarding state reset successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to reset onboarding:', error);
    return false;
  }
};