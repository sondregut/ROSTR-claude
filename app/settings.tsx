import React, { useRef } from 'react';
import { StyleSheet, View, Text, Pressable, useColorScheme as useRNColorScheme, Alert, PanResponder, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useSafeUser } from '@/hooks/useSafeUser';
import { openFeatureRequest } from '@/lib/featurebase';
import { useNotifications } from '@/contexts/NotificationContext';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

// Check if we're in Expo Go (simulators with dev builds can handle push notifications)
const isExpoGo = Constants.appOwnership === 'expo';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { themeMode, setThemeMode } = useTheme();
  const auth = useSafeAuth();
  const signOut = auth?.signOut;
  const deleteAccount = auth?.deleteAccount;
  const router = useRouter();
  const user = useSafeUser();
  const userProfile = user?.userProfile;
  const { 
    preferences, 
    updatePreferences, 
    pushEnabled, 
    requestPushPermissions 
  } = useNotifications();

  // Animation values for swipe down
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Pan responder for swipe down gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) => {
        // Allow pan responder to capture touches from the start
        return gestureState.dy > 0;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward swipes
        return gestureState.dy > 10 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // If swiped down more than 100 pixels, close the screen
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          // Otherwise, snap back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: 'sunny-outline' as const },
    { value: 'dark' as const, label: 'Dark', icon: 'moon-outline' as const },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // The navigation will be handled automatically by AuthenticatedApp
              // when isAuthenticated becomes false
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone and will permanently delete all your data including:\n\n• Your profile\n• All dates and ratings\n• Your roster\n• Friend circles\n• All photos and content',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. Your account will be permanently deleted.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      // Navigation handled automatically by auth context
                    } catch (error) {
                      console.error('Delete account error:', error);
                      Alert.alert('Error', 'Failed to delete account. Please contact support.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async () => {
    if (!pushEnabled) {
      // Check if we're in an environment that doesn't support push notifications
      if (isExpoGo) {
        Alert.alert(
          'Push Notifications Unavailable',
          'Push notifications require a development build. They are not available in Expo Go.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const enabled = await requestPushPermissions();
      if (!enabled) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
      }
    } else {
      await updatePreferences({ push_enabled: false });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleToggleNotificationPreference = async (key: keyof typeof preferences, value: boolean) => {
    await updatePreferences({ [key]: value });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          transform: [{ translateY }] 
        }
      ]}
      {...panResponder.panHandlers}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        {/* Custom Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <View style={styles.themeOptions}>
            {themeOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.themeOption,
                  { 
                    backgroundColor: themeMode === option.value ? colors.primary : colors.background,
                    borderColor: themeMode === option.value ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setThemeMode(option.value)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={24} 
                  color={themeMode === option.value ? 'white' : colors.text} 
                />
                <Text 
                  style={[
                    styles.themeOptionText, 
                    { color: themeMode === option.value ? 'white' : colors.text }
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          
          {/* Master Push Notification Toggle */}
          <Pressable
            style={[styles.notificationCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleToggleNotifications}
          >
            <View style={styles.notificationCardIcon}>
              <Ionicons name="notifications" size={24} color={pushEnabled ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.notificationCardContent}>
              <Text style={[styles.notificationCardTitle, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.notificationCardDescription, { color: colors.textSecondary }]}>
                Enable to receive notifications about your dating activity
              </Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: pushEnabled ? colors.primary : colors.border }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: pushEnabled ? 22 : 2 }] }]} />
            </View>
          </Pressable>

          {pushEnabled && preferences && (
            <View style={styles.notificationPreferences}>
              {/* Likes & Reactions Card */}
              <Pressable
                style={[styles.notificationCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleToggleNotificationPreference('likes_reactions', !preferences.likes_reactions)}
              >
                <View style={styles.notificationCardIcon}>
                  <Ionicons name="heart" size={24} color={preferences.likes_reactions ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.notificationCardContent}>
                  <Text style={[styles.notificationCardTitle, { color: colors.text }]}>Likes & Reactions</Text>
                  <Text style={[styles.notificationCardDescription, { color: colors.textSecondary }]}>
                    When someone likes your dates or roster entries
                  </Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: preferences.likes_reactions ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: preferences.likes_reactions ? 22 : 2 }] }]} />
                </View>
              </Pressable>

              {/* Comments Card */}
              <Pressable
                style={[styles.notificationCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleToggleNotificationPreference('comments', !preferences.comments)}
              >
                <View style={styles.notificationCardIcon}>
                  <Ionicons name="chatbubble" size={24} color={preferences.comments ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.notificationCardContent}>
                  <Text style={[styles.notificationCardTitle, { color: colors.text }]}>Comments</Text>
                  <Text style={[styles.notificationCardDescription, { color: colors.textSecondary }]}>
                    When someone comments on your dates or mentions you
                  </Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: preferences.comments ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: preferences.comments ? 22 : 2 }] }]} />
                </View>
              </Pressable>

              {/* Friend Activity Card */}
              <Pressable
                style={[styles.notificationCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleToggleNotificationPreference('friend_activity', !preferences.friend_activity)}
              >
                <View style={styles.notificationCardIcon}>
                  <Ionicons name="people" size={24} color={preferences.friend_activity ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.notificationCardContent}>
                  <Text style={[styles.notificationCardTitle, { color: colors.text }]}>Friend Activity</Text>
                  <Text style={[styles.notificationCardDescription, { color: colors.textSecondary }]}>
                    Friend requests, new dates, and roster updates
                  </Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: preferences.friend_activity ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: preferences.friend_activity ? 22 : 2 }] }]} />
                </View>
              </Pressable>

              {/* Circle Updates Card */}
              <Pressable
                style={[styles.notificationCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleToggleNotificationPreference('circle_updates', !preferences.circle_updates)}
              >
                <View style={styles.notificationCardIcon}>
                  <Ionicons name="people-circle" size={24} color={preferences.circle_updates ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.notificationCardContent}>
                  <Text style={[styles.notificationCardTitle, { color: colors.text }]}>Circle Updates</Text>
                  <Text style={[styles.notificationCardDescription, { color: colors.textSecondary }]}>
                    Circle invites, messages, and member activity
                  </Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: preferences.circle_updates ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: preferences.circle_updates ? 22 : 2 }] }]} />
                </View>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Social</Text>
          
          <Pressable
            style={[styles.accountButton, { borderColor: colors.border }]}
            onPress={() => router.push('/friend-requests')}
          >
            <Ionicons name="people-outline" size={20} color={colors.text} />
            <Text style={[styles.accountButtonText, { color: colors.text }]}>Friend Requests</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <Pressable
            style={[styles.accountButton, { borderColor: colors.border }]}
            onPress={() => router.push('/phone-settings')}
          >
            <Ionicons name="call-outline" size={20} color={colors.text} />
            <Text style={[styles.accountButtonText, { color: colors.text }]}>Phone Number</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          
          <View style={styles.aboutItem}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Feedback & Support</Text>
          
          <Pressable
            style={[styles.feedbackButton, { borderColor: colors.border }]}
            onPress={() => openFeatureRequest({
              name: userProfile?.name,
              email: userProfile?.instagramUsername ? `${userProfile.instagramUsername}@instagram.com` : undefined,
              id: userProfile?.id
            })}
          >
            <Ionicons name="bulb-outline" size={20} color={colors.text} />
            <Text style={[styles.feedbackButtonText, { color: colors.text }]}>Request a Feature</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.feedbackButton, { borderColor: colors.border }]}
            onPress={() => openFeatureRequest({
              name: userProfile?.name,
              email: userProfile?.instagramUsername ? `${userProfile.instagramUsername}@instagram.com` : undefined,
              id: userProfile?.id
            })}
          >
            <Ionicons name="bug-outline" size={20} color={colors.text} />
            <Text style={[styles.feedbackButtonText, { color: colors.text }]}>Report a Bug</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Pressable
            style={[styles.signOutButton, { backgroundColor: colors.error }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Management</Text>
          <Pressable
            style={[styles.deleteAccountButton, { borderColor: colors.error }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.deleteAccountButtonText, { color: colors.error }]}>Delete Account</Text>
          </Pressable>
          <Text style={[styles.deleteAccountWarning, { color: colors.textSecondary }]}>
            Permanently delete your account and all associated data
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40, // Balance the layout
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  themeOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  accountButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    position: 'absolute',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountWarning: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  notificationCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationCardContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationCardDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  notificationPreferences: {
    marginTop: 8,
  },
});