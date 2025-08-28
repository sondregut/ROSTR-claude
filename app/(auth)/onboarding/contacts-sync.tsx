import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { ContactSyncService } from '@/services/contacts/ContactSyncService';
import { FriendService } from '@/services/supabase/friends';

export default function ContactsSyncScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [matchedFriends, setMatchedFriends] = useState<any[]>([]);
  const [autoFriendEnabled, setAutoFriendEnabled] = useState(true);

  const handleSyncContacts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Sync contacts
      const result = await ContactSyncService.syncContacts(user.id);

      if (result.success) {
        setMatchedFriends(result.newMatches || []);
        
        // Auto-friend mutual contacts if enabled
        if (autoFriendEnabled && result.newMatches) {
          const mutualContacts = result.newMatches.filter(m => m.is_mutual_contact && !m.is_friend);
          
          if (mutualContacts.length > 0) {
            const friendedCount = await ContactSyncService.autoFriendMutualContacts(user.id);
            if (friendedCount > 0) {
              Alert.alert(
                'Friends Added!',
                `Automatically connected with ${friendedCount} mutual contacts as friends.`
              );
            }
          }
        }

        setSyncComplete(true);
      } else {
        Alert.alert('Unable to Sync', result.message);
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      Alert.alert('Error', 'Failed to sync contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/');
  };

  const handleContinue = () => {
    router.replace('/(tabs)/');
  };

  if (syncComplete) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFF8F3', '#FFE4D0']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </View>
            </View>

            <Text style={styles.title}>
              {matchedFriends.length > 0
                ? `Found ${matchedFriends.length} Friends!`
                : 'Sync Complete'}
            </Text>

            {matchedFriends.length > 0 ? (
              <>
                <Text style={styles.description}>
                  We found people from your contacts who are already on ROSTR.
                  {matchedFriends.filter(m => m.is_mutual_contact).length > 0 &&
                    ` ${matchedFriends.filter(m => m.is_mutual_contact).length} of them also have you in their contacts!`}
                </Text>

                <View style={styles.matchPreview}>
                  {matchedFriends.slice(0, 3).map((friend, index) => (
                    <View key={friend.matched_user_id} style={styles.matchedUser}>
                      <Image
                        source={{ uri: friend.matched_user_image || 'https://via.placeholder.com/60' }}
                        style={styles.matchedAvatar}
                      />
                      <Text style={styles.matchedName} numberOfLines={1}>
                        {friend.matched_user_name.split(' ')[0]}
                      </Text>
                      {friend.is_mutual_contact && (
                        <View style={styles.mutualBadge}>
                          <Ionicons name="swap-horizontal" size={12} color="white" />
                        </View>
                      )}
                    </View>
                  ))}
                  {matchedFriends.length > 3 && (
                    <View style={styles.moreIndicator}>
                      <Text style={styles.moreText}>+{matchedFriends.length - 3}</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.description}>
                Your contacts have been synced. When your friends join ROSTR,
                you'll automatically discover each other!
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <Pressable style={styles.primaryButton} onPress={handleContinue}>
                <Text style={styles.primaryButtonText}>
                  {matchedFriends.length > 0 ? 'View Friends' : 'Get Started'}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF8F3', '#FFE4D0']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="phone-portrait-outline" size={80} color="#FE5268" />
            </View>
          </View>

          <Text style={styles.title}>Find Your Friends</Text>
          <Text style={styles.subtitle}>Connect Instantly</Text>
          
          <Text style={styles.description}>
            Allow ROSTR to access your contacts to discover friends already on the app.
            We'll only connect you with people who also have your number.
          </Text>

          <View style={styles.privacyInfo}>
            <View style={styles.privacyItem}>
              <Ionicons name="lock-closed" size={20} color="#666" />
              <Text style={styles.privacyText}>
                Your contacts are encrypted and never shared
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Ionicons name="swap-horizontal" size={20} color="#666" />
              <Text style={styles.privacyText}>
                Only mutual contacts can discover each other
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Ionicons name="settings" size={20} color="#666" />
              <Text style={styles.privacyText}>
                You can disable this anytime in settings
              </Text>
            </View>
          </View>

          <View style={styles.autoFriendOption}>
            <Pressable
              style={styles.checkboxContainer}
              onPress={() => setAutoFriendEnabled(!autoFriendEnabled)}
            >
              <View style={[styles.checkbox, autoFriendEnabled && styles.checkboxChecked]}>
                {autoFriendEnabled && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Auto-connect with mutual contacts as friends
              </Text>
            </Pressable>
          </View>

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#FE5268" />
            ) : (
              <>
                <Pressable style={styles.primaryButton} onPress={handleSyncContacts}>
                  <Ionicons name="people" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Sync Contacts</Text>
                </Pressable>
                
                <Pressable style={styles.secondaryButton} onPress={handleSkip}>
                  <Text style={styles.secondaryButtonText}>Maybe Later</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(254, 82, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#FE5268',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  privacyInfo: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  autoFriendOption: {
    width: '100%',
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FE5268',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FE5268',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#FE5268',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 200,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  matchPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  matchedUser: {
    alignItems: 'center',
    position: 'relative',
  },
  matchedAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  matchedName: {
    fontSize: 12,
    color: '#333',
    maxWidth: 70,
  },
  mutualBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
});