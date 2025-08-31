import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/buttons/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FriendRequestService } from '@/services/FriendRequestService';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger';

export default function FriendInviteScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const auth = useSafeAuth();
  const { ref, phone, invited_by } = useLocalSearchParams();

  const [isAccepting, setIsAccepting] = React.useState(false);
  const [referrerName, setReferrerName] = React.useState<string>('A friend');

  React.useEffect(() => {
    const fetchReferrerName = async () => {
      if (ref && typeof ref === 'string') {
        try {
          const { data: referrer } = await supabase
            .from('users')
            .select('name, username')
            .eq('id', ref)
            .single();

          if (referrer?.name) {
            setReferrerName(referrer.name);
          }
        } catch (error) {
          logger.debug('Failed to fetch referrer name:', error);
        }
      } else if (invited_by && typeof invited_by === 'string') {
        setReferrerName(decodeURIComponent(invited_by));
      }
    };

    fetchReferrerName();
  }, [ref, invited_by]);

  const handleAcceptInvite = async () => {
    if (!auth?.user?.id || !ref || typeof ref !== 'string') {
      return;
    }

    try {
      setIsAccepting(true);
      
      // Auto-connect with referrer
      const success = await FriendRequestService.sendFriendRequest(ref);
      
      if (success) {
        logger.debug('✅ Auto-connected with referrer:', referrerName);
        router.replace('/(tabs)/');
      } else {
        logger.debug('Friend request failed or already exists');
        router.replace('/(tabs)/');
      }
    } catch (error) {
      logger.debug('Failed to auto-connect:', error);
      router.replace('/(tabs)/');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleClose = () => {
    router.replace('/(tabs)/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to RostrDating!
        </Text>
        <Pressable
          onPress={handleClose}
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
        <View style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="heart" size={40} color={colors.primary} />
          </View>
          
          <Text style={[styles.inviteTitle, { color: colors.text }]}>
            You're Invited!
          </Text>
          
          <Text style={[styles.inviteMessage, { color: colors.text }]}>
            <Text style={{ fontWeight: '600' }}>{referrerName}</Text> invited you to join RostrDating!
          </Text>
          
          <Text style={[styles.inviteDescription, { color: colors.textSecondary }]}>
            Track your dating journey, share experiences with friends, and get insights into your dating life.
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
                Track your dates and experiences
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.statusActive} />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Share updates with trusted friends
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.statusActive} />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Get advice and support from your circle
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Maybe Later"
            variant="outline"
            onPress={handleClose}
            style={styles.actionButton}
            disabled={isAccepting}
          />
          <Button
            title={isAccepting ? "Connecting..." : "Get Started"}
            variant="primary"
            onPress={handleAcceptInvite}
            style={styles.actionButton}
            disabled={isAccepting}
          />
        </View>
      </View>
    </SafeAreaView>
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
});