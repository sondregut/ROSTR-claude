import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FriendRequestService } from '@/services/FriendRequestService';
import { logger } from '@/utils/productionLogger';
import { supabase } from '@/lib/supabase';
import { useSafeAuth } from '@/hooks/useSafeAuth';

interface FriendRequestPopupData {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserImage?: string;
  message?: string;
}

interface FriendRequestPopupProps {
  onClose?: () => void;
}

export const FriendRequestPopup: React.FC<FriendRequestPopupProps> = ({ onClose }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const auth = useSafeAuth();
  const [visible, setVisible] = useState(false);
  const [requestData, setRequestData] = useState<FriendRequestPopupData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-200)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!auth?.user?.id) return;

    // Subscribe to friend request notifications
    const channel = supabase
      .channel('friend-request-popup')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `to_user_id=eq.${auth.user.id}`,
        },
        async (payload) => {
          logger.debug('📬 New friend request received:', payload.new);

          // Get sender details
          const { data: sender } = await supabase
            .from('users')
            .select('id, name, profile_image_url')
            .eq('id', payload.new.from_user_id)
            .single();

          if (sender) {
            const newRequest: FriendRequestPopupData = {
              id: payload.new.id,
              fromUserId: sender.id,
              fromUserName: sender.name,
              fromUserImage: sender.profile_image_url,
              message: payload.new.message,
            };

            setRequestData(newRequest);
            setVisible(true);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [auth?.user?.id]);

  useEffect(() => {
    if (visible && requestData) {
      // Animate popup in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 10 seconds if no action taken
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [visible, requestData]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setRequestData(null);
      onClose?.();
    });
  };

  const handleAccept = async () => {
    if (!requestData || isProcessing) return;

    try {
      setIsProcessing(true);
      const success = await FriendRequestService.acceptRequest(requestData.id);

      if (success) {
        logger.debug('✅ Friend request accepted');
        handleClose();
      }
    } catch (error) {
      logger.debug('Failed to accept friend request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!requestData || isProcessing) return;

    try {
      setIsProcessing(true);
      const success = await FriendRequestService.declineRequest(requestData.id);

      if (success) {
        logger.debug('❌ Friend request declined');
        handleClose();
      }
    } catch (error) {
      logger.debug('Failed to decline friend request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible || !requestData) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.popup,
            {
              backgroundColor: colors.card,
              shadowColor: colors.text,
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Friend Request
              </Text>
              <Pressable
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.content}>
              <View style={styles.userInfo}>
                {requestData.fromUserImage ? (
                  <Image
                    source={{ uri: requestData.fromUserImage }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.textContainer}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {requestData.fromUserName}
                  </Text>
                  <Text style={[styles.message, { color: colors.textSecondary }]}>
                    {requestData.message || 'wants to be your friend'}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={handleDecline}
                  disabled={isProcessing}
                  style={[
                    styles.button,
                    styles.declineButton,
                    { borderColor: colors.border },
                    isProcessing && styles.buttonDisabled,
                  ]}
                >
                  <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                    Decline
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleAccept}
                  disabled={isProcessing}
                  style={[
                    styles.button,
                    styles.acceptButton,
                    { backgroundColor: colors.primary },
                    isProcessing && styles.buttonDisabled,
                  ]}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    Accept
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  popup: {
    marginHorizontal: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    borderWidth: 1,
  },
  acceptButton: {},
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});