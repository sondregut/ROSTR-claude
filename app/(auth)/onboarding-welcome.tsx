import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { Colors } from '@/constants/Colors';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const {
    hasSeenWelcome,
    isLoading,
    markWelcomeSeen,
  } = useOnboardingState();

  // If user has already seen welcome, redirect to auth
  useEffect(() => {
    if (!isLoading && hasSeenWelcome) {
      router.replace('/(auth)/welcome-new');
    }
  }, [hasSeenWelcome, isLoading]);

  const handleComplete = async () => {
    await markWelcomeSeen();
    router.replace('/(auth)/welcome-new');
  };

  const handleSkip = async () => {
    await markWelcomeSeen();
    router.replace('/(auth)/welcome-new');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <OnboardingScreen 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F3',
  },
});