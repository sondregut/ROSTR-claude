import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCirclePermissions } from '@/hooks/useCirclePermissions';
import { CircleService, type Circle, type CircleMember } from '@/services/supabase/circles';
import { useAuth } from '@/contexts/SimpleAuthContext';

export default function CircleSettingsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const permissions = useCirclePermissions(id as string);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  useEffect(() => {
    loadCircleData();
  }, [id]);
  
  const loadCircleData = async () => {
    try {
      const { circle, members } = await CircleService.getCircleWithMembers(id as string);
      setCircle(circle);
      setMembers(members);
      setName(circle.name);
      setDescription(circle.description || '');
      setIsPrivate(circle.is_private);
    } catch (error) {
      console.error('Failed to load circle data:', error);
      Alert.alert('Error', 'Failed to load circle settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!permissions.canEditCircle || !circle) return;
    
    setIsSaving(true);
    try {
      await CircleService.updateCircle(circle.id, {
        name: name.trim(),
        description: description.trim(),
        is_private: isPrivate,
      });
      Alert.alert('Success', 'Circle settings updated');
    } catch (error) {
      console.error('Failed to update circle:', error);
      Alert.alert('Error', 'Failed to update circle settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRemoveMember = async (member: CircleMember) => {
    if (!permissions.canRemoveMembers || member.role === 'owner') return;
    
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.user?.name} from this circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await CircleService.removeMember(circle!.id, member.user_id);
              setMembers(members.filter(m => m.user_id !== member.user_id));
              Alert.alert('Success', 'Member removed');
            } catch (error) {
              console.error('Failed to remove member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };
  
  const handlePromoteMember = async (member: CircleMember, newRole: 'admin' | 'member') => {
    if (!permissions.canPromoteMembers) return;
    
    try {
      await CircleService.updateMemberRole(circle!.id, member.user_id, newRole);
      setMembers(members.map(m => 
        m.user_id === member.user_id ? { ...m, role: newRole } : m
      ));
      Alert.alert('Success', `Member ${newRole === 'admin' ? 'promoted to admin' : 'demoted to member'}`);
    } catch (error) {
      console.error('Failed to update member role:', error);
      Alert.alert('Error', 'Failed to update member role');
    }
  };
  
  const handleDeleteCircle = () => {
    if (!permissions.canDeleteCircle) return;
    
    Alert.alert(
      'Delete Circle',
      'Are you sure you want to delete this circle? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CircleService.deleteCircle(circle!.id);
              router.replace('/circles');
            } catch (error) {
              console.error('Failed to delete circle:', error);
              Alert.alert('Error', 'Failed to delete circle');
            }
          },
        },
      ]
    );
  };
  
  if (isLoading || permissions.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  if (!permissions.canEditCircle) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            You don't have permission to access these settings
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const renderMember = (member: CircleMember) => {
    const isCurrentUser = member.user_id === user?.id;
    const canModify = permissions.canRemoveMembers && member.role !== 'owner' && !isCurrentUser;
    
    return (
      <View key={member.id} style={[styles.memberItem, { backgroundColor: colors.card }]}>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: colors.text }]}>{member.user?.name}</Text>
          <Text style={[styles.memberUsername, { color: colors.textSecondary }]}>
            @{member.user?.username} • {member.role}
          </Text>
        </View>
        
        {canModify && (
          <View style={styles.memberActions}>
            {permissions.canPromoteMembers && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => handlePromoteMember(member, member.role === 'admin' ? 'member' : 'admin')}
              >
                <Text style={styles.actionButtonText}>
                  {member.role === 'admin' ? 'Demote' : 'Promote'}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={() => handleRemoveMember(member)}
            >
              <Text style={styles.actionButtonText}>Remove</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Circle Settings</Text>
          <Pressable
            onPress={handleSaveChanges}
            disabled={isSaving}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.primary }]}>Save</Text>
            )}
          </Pressable>
        </View>
        
        {/* Circle Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Circle Information</Text>
          
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Circle name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this circle about?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
        
        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy</Text>
          
          <View style={[styles.switchContainer, { backgroundColor: colors.card }]}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Private Circle</Text>
              <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                Only members can see circle content
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isPrivate ? colors.background : colors.card}
            />
          </View>
        </View>
        
        {/* Members Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Members ({members.length})</Text>
          {members.map(renderMember)}
        </View>
        
        {/* Danger Zone */}
        {permissions.canDeleteCircle && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
            
            <Pressable
              style={[styles.dangerButton, { borderColor: colors.error }]}
              onPress={handleDeleteCircle}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.dangerButtonText, { color: colors.error }]}>
                Delete Circle
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});