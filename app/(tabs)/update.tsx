import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DateEntryForm, DateEntryFormData } from '@/components/ui/forms/DateEntryForm';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDates } from '@/contexts/DateContext';

export default function UpdateScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { addDate } = useDates();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(Date.now()); // Key to force form reset
  
  const handleSubmit = async (formData: DateEntryFormData) => {
    try {
      setIsSubmitting(true);
      
      // Save the date entry to the context
      await addDate(formData);
      
      // Reset the form by changing its key
      setFormKey(Date.now());
      
      // Navigate directly to feed tab to show the new entry
      router.push('/(tabs)');
    } catch (error) {
      console.error('Error saving date:', error);
      Alert.alert(
        'Error',
        'Failed to save your date update. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    // Navigate back to feed
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Update</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'ios' ? 120 : 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <DateEntryForm
            key={formKey}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
