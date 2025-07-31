import { useState, useEffect } from 'react';
import { onboardingService } from '@/services/onboardingService';

export interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCreatedAccount: boolean;
  hasCreatedCircle: boolean;
  hasInvitedFriends: boolean;
  hasAddedRoster: boolean;
  hasSeenCoachMarks: boolean;
  isComplete: boolean;
  isLoading: boolean;
  nextStep: string | null;
}

export const useOnboardingState = () => {
  const [state, setState] = useState<OnboardingState>({
    hasSeenWelcome: false,
    hasCreatedAccount: false,
    hasCreatedCircle: false,
    hasInvitedFriends: false,
    hasAddedRoster: false,
    hasSeenCoachMarks: false,
    isComplete: false,
    isLoading: true,
    nextStep: null,
  });

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const [progress, isComplete, nextStep] = await Promise.all([
        onboardingService.getProgress(),
        onboardingService.isOnboardingComplete(),
        onboardingService.getNextStep(),
      ]);

      setState({
        ...progress,
        isComplete,
        isLoading: false,
        nextStep,
      });
    } catch (error) {
      console.error('Error loading onboarding state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateOnboardingState = async () => {
    await loadOnboardingState();
  };

  const markWelcomeSeen = async () => {
    await onboardingService.markWelcomeSeen();
    await updateOnboardingState();
  };

  const markCircleCreated = async () => {
    await onboardingService.markCircleCreated();
    await updateOnboardingState();
  };

  const markFriendsInvited = async () => {
    await onboardingService.markFriendsInvited();
    await updateOnboardingState();
  };

  const markRosterAdded = async () => {
    await onboardingService.markRosterAdded();
    await updateOnboardingState();
  };

  const markCoachMarksSeen = async () => {
    await onboardingService.markCoachMarksSeen();
    await updateOnboardingState();
  };

  const completeOnboarding = async () => {
    await onboardingService.completeOnboarding();
    await updateOnboardingState();
  };

  const resetOnboarding = async () => {
    await onboardingService.resetOnboarding();
    await updateOnboardingState();
  };

  return {
    ...state,
    markWelcomeSeen,
    markCircleCreated,
    markFriendsInvited,
    markRosterAdded,
    markCoachMarksSeen,
    completeOnboarding,
    resetOnboarding,
    refresh: updateOnboardingState,
  };
};