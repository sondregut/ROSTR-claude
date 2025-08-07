import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  Clipboard as RNClipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

import { Button } from '../buttons/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { shareApp } from '@/lib/inviteUtils';

interface ShareAppModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    id: string;
  };
}

const APP_STORE_URL = 'https://apps.apple.com/app/rostrdating/id123456789'; // Replace with actual App Store URL
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.rostrdating'; // Replace with actual Play Store URL
const APP_WEBSITE = 'https://rostrdating.app'; // Replace with actual website

export function ShareAppModal({ visible, onClose, userProfile }: ShareAppModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const generateReferralLink = (): string => {
    return `${APP_WEBSITE}?ref=${userProfile.id}&invited_by=${encodeURIComponent(userProfile.name)}`;
  };

  const generateShareMessage = (): string => {
    const referralLink = generateReferralLink();
    return `Hey! Join me on RostrDating - the dating tracker app that helps you keep track of your dating journey and share experiences with friends! 📱💕\n\n${referralLink}`;
  };

  const handleShareApp = async () => {
    try {
      await shareApp(userProfile);
    } catch (error) {
      console.error('Error sharing app:', error);
      Alert.alert('Error', 'Failed to share the app. Please try again.');
    }
  };

  const handleCopyLink = async () => {
    try {
      const referralLink = generateReferralLink();
      if (Platform.OS === 'ios') {
        RNClipboard.setString(referralLink);
      } else {
        RNClipboard.setString(referralLink);
      }
      Alert.alert(
        'Link Copied!',
        'The referral link has been copied to your clipboard. Share it with your friends!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link. Please try again.');
    }
  };

  const handleAppStoreShare = async () => {
    try {
      const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
      const message = `Check out RostrDating - the dating tracker app! ${userProfile.name} is using it to track their dating journey. Download it here: ${storeUrl}`;
      
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(message, {
          mimeType: 'text/plain',
          dialogTitle: 'Share RostrDating',
          UTI: 'public.text',
        });
      } else {
        RNClipboard.setString(storeUrl);
        Alert.alert('Link Copied!', 'App store link copied to clipboard.');
      }
    } catch (error) {
      console.error('Error sharing app store link:', error);
      Alert.alert('Error', 'Failed to share app store link. Please try again.');
    }
  };

  const shareOptions = [
    {
      id: 'share',
      title: 'Share with Referral',
      subtitle: 'Share your personal invite link',
      icon: 'share-outline' as const,
      onPress: handleShareApp,
      color: colors.primary,
    },
    {
      id: 'copy',
      title: 'Copy Link',
      subtitle: 'Copy referral link to clipboard',
      icon: 'copy-outline' as const,
      onPress: handleCopyLink,
      color: colors.tint,
    },
    {
      id: 'appstore',
      title: 'Share App Store Link',
      subtitle: 'Share direct download link',
      icon: 'download-outline' as const,
      onPress: handleAppStoreShare,
      color: colors.tint,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Share RostrDating</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed
            ]}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="heart" size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Invite your friends!
            </Text>
            <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
              Share RostrDating with friends and track your dating journeys together. 
              They'll get a special invite from you when they join!
            </Text>
          </View>


          <View style={styles.optionsContainer}>
            {shareOptions.map((option) => (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.optionItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && styles.pressed
                ]}
                onPress={option.onPress}
                accessibilityRole="button"
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                    <Ionicons name={option.icon} size={20} color={option.color} />
                  </View>
                  <View>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              When friends join through your link, you'll both get notified and can connect on the app!
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  footer: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});