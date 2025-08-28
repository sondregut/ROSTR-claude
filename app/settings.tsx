import React, { useRef } from 'react';
import { StyleSheet, View, Text, Pressable, useColorScheme as useRNColorScheme, Alert, PanResponder, Animated } from 'react-native';
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

// Check if we're in a simulator/emulator or Expo Go
const isSimulator = !Constants.isDevice;
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
      if (isSimulator || isExpoGo) {
        Alert.alert(
          'Push Notifications Unavailable',
          isSimulator 
            ? 'Push notifications are not available in the simulator. Please test on a real device.'
            : 'Push notifications require a development build. They are not available in Expo Go.',
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Settings',
            headerTitleStyle: { color: colors.text },
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerLeft: () => (
              <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 8 }}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            ),
            headerBackVisible: false,
          }}
        />
        
        <View style={styles.content}>
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
          
          <Pressable
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={handleToggleNotifications}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Get notified about likes, comments, and friend activity
              </Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: pushEnabled ? colors.primary : colors.border }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: pushEnabled ? 22 : 2 }] }]} />
            </View>
          </Pressable>

          {pushEnabled && preferences && (
            <>
              <Pressable
                style={[styles.settingRow, { borderBottomColor: colors.border }]}
                onPress={() => handleToggleNotificationPreference('likes_reactions', !preferences.likes_reactions)}
              >
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Likes & Reactions</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: preferences.likes_reactions ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: preferences.likes_reactions ? 22 : 2 }] }]} />
                </View>
              </Pressable>

              <Pressable
                style={[styles.settingRow, { borderBottomColor: colors.border }]}
                onPress={() => handleToggleNotificationPreference('comments', !preferences.comments)}
              >
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Comments & Mentions</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: preferences.comments ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: preferences.comments ? 22 : 2 }] }]} />
                </View>
              </Pressable>

              <Pressable
                style={[styles.settingRow, { borderBottomColor: colors.border }]}
                onPress={() => handleToggleNotificationPreference('friend_activity', !preferences.friend_activity)}
              >
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Friend Activity</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: preferences.friend_activity ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: preferences.friend_activity ? 22 : 2 }] }]} />
                </View>
              </Pressable>

              <Pressable
                style={[styles.settingRow, { borderBottomColor: colors.border }]}
                onPress={() => handleToggleNotificationPreference('circle_updates', !preferences.circle_updates)}
              >
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Circle Updates</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: preferences.circle_updates ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: preferences.circle_updates ? 22 : 2 }] }]} />
                </View>
              </Pressable>
            </>
          )}
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
      </View>
    </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
});