import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { DateEntryForm, DateEntryFormData } from '@/components/ui/forms/DateEntryForm';
import { Colors } from '@/constants/Colors';

export default function UpdateScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const handleSubmit = (formData: DateEntryFormData) => {
    // In a real app, this would save the date entry to a database
    console.log('Submitted form data:', formData);
    // Navigate back to feed or show success message
  };
  
  const handleCancel = () => {
    // Navigate back or reset form
    console.log('Form cancelled');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Update</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <DateEntryForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
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
    borderBottomColor: '#F0F0F0',
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
});
