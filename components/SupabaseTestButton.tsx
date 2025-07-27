import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { testSupabaseConnection, testRealtimeConnection } from '@/utils/testSupabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function SupabaseTestButton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTestConnection = async () => {
    setIsLoading(true);
    
    try {
      // Test basic connection
      const connectionResult = await testSupabaseConnection();
      
      // Test real-time
      const realtimeResult = await testRealtimeConnection();
      
      Alert.alert(
        'Supabase Test Results',
        `Connection: ${connectionResult.success ? '✅' : '❌'} ${connectionResult.message}\n\nReal-time: ${realtimeResult.success ? '✅' : '❌'} ${realtimeResult.message}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert(
        'Test Failed',
        `Error testing Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          isLoading && styles.buttonDisabled
        ]}
        onPress={handleTestConnection}
        disabled={isLoading}
      >
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
          {isLoading ? 'Testing Supabase...' : 'Test Supabase Connection'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});