import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../buttons/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface InviteAcceptanceScreenProps {
  visible: boolean;
  onClose: () => void;
  inviteData: {
    circleId?: string;
    circleName?: string;
    inviterName?: string;
    referralCode?: string;
  };
  onAcceptInvite: (circleId: string) => Promise<void>;
  onDeclineInvite: () => void;
}

export function InviteAcceptanceScreen({
  visible,
  onClose,
  inviteData,
  onAcceptInvite,
  onDeclineInvite,
}: InviteAcceptanceScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isAccepting, setIsAccepting] = useState(false);

  const { circleId, circleName, inviterName, referralCode } = inviteData;

  const handleAcceptInvite = async () => {
    if (!circleId) {
      Alert.alert('Error', 'Invalid invitation. Please try again.');
      return;
    }

    try {
      setIsAccepting(true);
      await onAcceptInvite(circleId);
      Alert.alert(
        'Success!',
        `You've joined ${circleName || 'the circle'}! Welcome to the group! 🎉`,
        [{ text: 'Great!', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error accepting invite:', error);
      Alert.alert(
        'Error',
        'Failed to join the circle. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineInvite = () => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: () => {
            onDeclineInvite();
            onClose();
          }
        },
      ]
    );
  };

  const isCircleInvite = Boolean(circleId && circleName);

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isCircleInvite ? 'Circle Invitation' : 'Welcome to RostrDating!'}
          </Text>
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
          {isCircleInvite ? (
            <>
              {/* Circle Invitation Content */}
              <View style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Ionicons name="people" size={40} color={colors.primary} />
                </View>
                
                <Text style={[styles.inviteTitle, { color: colors.text }]}>
                  You're Invited!
                </Text>
                
                <Text style={[styles.inviteMessage, { color: colors.text }]}>
                  <Text style={{ fontWeight: '600' }}>{inviterName || 'Someone'}</Text> invited you to join{' '}
                  <Text style={{ fontWeight: '600', color: colors.primary }}>"{circleName}"</Text>{' '}
                  on RostrDating!
                </Text>
                
                <Text style={[styles.inviteDescription, { color: colors.textSecondary }]}>
                  Circles are private groups where you can share and track your dating experiences with trusted friends.
                </Text>
              </View>

              <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                  What you'll get:
                </Text>
                
                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.statusActive} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>
                      Share dating updates with the group
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.statusActive} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>
                      Get advice and support from friends
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.statusActive} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>
                      Track your dating journey together
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* General App Invitation Content */}
              <View style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Ionicons name="heart" size={40} color={colors.primary} />
                </View>
                
                <Text style={[styles.inviteTitle, { color: colors.text }]}>
                  Welcome to RostrDating!
                </Text>
                
                <Text style={[styles.inviteMessage, { color: colors.text }]}>
                  {inviterName ? (
                    <>
                      <Text style={{ fontWeight: '600' }}>{inviterName}</Text> invited you to join RostrDating!
                    </>
                  ) : (
                    'You\'ve been invited to join RostrDating!'
                  )}
                </Text>
                
                <Text style={[styles.inviteDescription, { color: colors.textSecondary }]}>
                  Track your dating journey, share experiences with friends, and get insights into your dating life.
                </Text>
              </View>
            </>
          )}

          <View style={styles.actions}>
            {isCircleInvite ? (
              <>
                <Button
                  title="Decline"
                  variant="outline"
                  onPress={handleDeclineInvite}
                  style={styles.actionButton}
                  disabled={isAccepting}
                />
                <Button
                  title={isAccepting ? "Joining..." : "Join Circle"}
                  variant="primary"
                  onPress={handleAcceptInvite}
                  style={styles.actionButton}
                  disabled={isAccepting}
                />
              </>
            ) : (
              <Button
                title="Get Started"
                variant="primary"
                onPress={onClose}
                style={styles.fullWidthButton}
              />
            )}
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
  inviteCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  inviteTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  inviteMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  inviteDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 20,
  },
  actionButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
});