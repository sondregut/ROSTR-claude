import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '@/services/supabase/auth';

export default function TroubleSignInScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleRecoverWithPhone = () => {
    router.push('/(auth)/create-account');
  };

  const handleRecoverWithEmail = () => {
    router.push('/(auth)/signin');
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Please email support@rostr.app for assistance with your account.',
      [
        { text: 'OK' }
      ]
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Trouble signing in?</Text>
            <Text style={styles.subtitle}>
              Choose an option below to regain access to your account
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <Pressable
              style={styles.optionButton}
              onPress={handleRecoverWithPhone}
            >
              <View style={styles.optionContent}>
                <Ionicons name="call-outline" size={24} color="#000" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Use phone number</Text>
                  <Text style={styles.optionDescription}>
                    Sign in with your phone number and SMS code
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>

            <Pressable
              style={styles.optionButton}
              onPress={handleRecoverWithEmail}
            >
              <View style={styles.optionContent}>
                <Ionicons name="mail-outline" size={24} color="#000" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Use email</Text>
                  <Text style={styles.optionDescription}>
                    Sign in with your email and password
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>

            <Pressable
              style={styles.optionButton}
              onPress={handleContactSupport}
            >
              <View style={styles.optionContent}>
                <Ionicons name="help-circle-outline" size={24} color="#000" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Contact support</Text>
                  <Text style={styles.optionDescription}>
                    Get help from our support team
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  titleSection: {
    marginTop: 32,
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});