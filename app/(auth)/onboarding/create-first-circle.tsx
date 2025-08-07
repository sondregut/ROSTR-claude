import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useCircles } from '@/contexts/CircleContext';

export default function CreateFirstCircleScreen() {
  const router = useRouter();
  const { markCircleCreated } = useOnboardingState();
  const { createCircle } = useCircles();
  const [circleName, setCircleName] = useState('Inner Circle');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create the circle
      await createCircle(circleName.trim());
      
      // Mark step as complete
      await markCircleCreated();
      
      // Navigate to next step
      router.push('/(auth)/onboarding/invite-friends');
    } catch (error) {
      console.error('Error creating circle:', error);
      Alert.alert('Error', 'Failed to create circle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    // Still mark as completed even if skipped
    await markCircleCreated();
    router.push('/(auth)/onboarding/invite-friends');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF8F3', '#FFE0CC']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '33%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 3</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="people-circle-outline" size={80} color="#FE5268" />
            </View>

            {/* Title and description */}
            <Text style={styles.title}>Create Your First Circle</Text>
            <Text style={styles.description}>
              Circles let you control who sees your dating updates. Your "Inner Circle" might see everything, while "Work Friends" see less.
            </Text>

            {/* Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Circle Name</Text>
              <TextInput
                style={styles.input}
                value={circleName}
                onChangeText={setCircleName}
                placeholder="e.g., Besties, Inner Circle"
                placeholderTextColor="#999"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleCreateCircle}
              />
              <Text style={styles.hint}>
                You can create more circles later
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              onPress={handleCreateCircle}
              loading={isLoading}
              disabled={!circleName.trim()}
              style={styles.createButton}
            >
              Create Circle
            </Button>

            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip for Now</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
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
    paddingHorizontal: 40,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  actions: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 16,
  },
  createButton: {
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