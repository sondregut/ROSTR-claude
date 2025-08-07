import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as AppleAuthentication from 'expo-apple-authentication';
import { AuthService } from '@/services/supabase/auth';
import { useAuth } from '@/contexts/AuthContext';

interface AuthOptionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthOptionsModal({ visible, onClose }: AuthOptionsModalProps) {
  const router = useRouter();
  const { signIn } = useAuth();
  const translateY = useSharedValue(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign In is only available on iOS devices.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if Apple Sign In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Not Available', 'Apple Sign In is not available on this device.');
        return;
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential received:', credential);

      // Sign in with Supabase using the Apple credential
      const result = await AuthService.signInWithApple({
        identityToken: credential.identityToken!,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      });

      if (result.user) {
        console.log('Apple Sign In successful:', result.user.id);
        onClose();
        // The AuthContext will handle navigation
      }
    } catch (error: any) {
      console.error('Apple Sign In error:', error);
      
      if (error.code === 'ERR_CANCELED') {
        // User cancelled, do nothing
        return;
      }
      
      Alert.alert(
        'Sign In Failed',
        'Unable to sign in with Apple. Please try another method.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handlePhoneSignIn = () => {
    onClose();
    router.push('/(auth)/phone-auth');
  };

  const handleTroubleSigningIn = () => {
    onClose();
    router.push('/(auth)/trouble-signin');
  };

  const handleOverlayPress = () => {
    onClose();
  };

  const closeModal = () => {
    onClose();
  };

  // Gesture handler for swipe down to dismiss
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateY.value = Math.max(0, context.startY + event.translationY);
    },
    onEnd: (event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // Close modal if dragged down far enough or with sufficient velocity
        runOnJS(closeModal)();
      } else {
        // Spring back to original position
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Overlay */}
      <Pressable style={styles.overlay} onPress={handleOverlayPress}>
        <LinearGradient 
          colors={['rgba(254, 82, 104, 0.9)', 'rgba(254, 107, 115, 0.9)']} 
          style={StyleSheet.absoluteFillObject}
        />
      </Pressable>

      {/* Modal Content */}
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.modalContent, animatedStyle]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.handle} />
              <Text style={styles.modalTitle}>Sign in to continue</Text>
              <Text style={styles.modalSubtitle}>
                Choose your preferred sign-in method. Standard rates may apply.
              </Text>
            </View>

            {/* Auth Options */}
            <View style={styles.authOptions}>
              <Pressable
                style={[styles.authButton, isLoading && styles.authButtonDisabled]}
                onPress={handleAppleSignIn}
                disabled={isLoading}
              >
                <Ionicons name="logo-apple" size={24} color="#000" />
                <Text style={styles.authButtonText}>
                  {isLoading ? 'Signing in...' : 'Sign in with Apple'}
                </Text>
              </Pressable>


              <Pressable
                style={styles.authButton}
                onPress={handlePhoneSignIn}
              >
                <Ionicons name="call" size={24} color="#666" />
                <Text style={styles.authButtonText}>Sign in with phone number</Text>
              </Pressable>
            </View>

            {/* Trouble Link */}
            <View style={styles.troubleContainer}>
              <Pressable onPress={handleTroubleSigningIn}>
                <Text style={styles.troubleText}>
                  Problems signing in?
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 280,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  authOptions: {
    gap: 12,
    marginBottom: 24,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  troubleContainer: {
    alignItems: 'center',
  },
  troubleText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
});