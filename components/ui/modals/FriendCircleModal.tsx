import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Pressable, 
  FlatList, 
  TextInput,
  Image,
  useColorScheme,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../buttons/Button';
import { Colors } from '../../../constants/Colors';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatarUri?: string;
  isSelected?: boolean;
}

interface FriendCircle {
  id: string;
  name: string;
  friends: Friend[];
}

interface FriendCircleModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateCircle: (circleName: string, description: string, friendIds: string[]) => void;
  friends: Friend[];
  existingCircles?: FriendCircle[];
}

export function FriendCircleModal({
  visible,
  onClose,
  onCreateCircle,
  friends,
  existingCircles = [],
}: FriendCircleModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  
  const toggleFriendSelection = (friend: Friend) => {
    const isAlreadySelected = selectedFriends.some(f => f.id === friend.id);
    
    if (isAlreadySelected) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };
  
  const handleCreateCircle = () => {
    if (circleName.trim() && selectedFriends.length > 0) {
      onCreateCircle(
        circleName,
        circleDescription,
        selectedFriends.map(friend => friend.id)
      );
      resetForm();
    }
  };
  
  const resetForm = () => {
    setCircleName('');
    setCircleDescription('');
    setSelectedFriends([]);
    setSearchQuery('');
  };
  
  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriends.some(f => f.id === item.id);
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.friendItem,
          pressed && styles.pressed,
          isSelected && { backgroundColor: `${colors.primary}20` }
        ]}
        onPress={() => toggleFriendSelection(item)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
      >
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            {item.avatarUri ? (
              <Image source={{ uri: item.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View>
            <Text style={[styles.friendName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.friendUsername, { color: colors.textSecondary }]}>
              @{item.username}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.checkbox, 
          { borderColor: colors.text },
          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
        ]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </Pressable>
    );
  };

  const renderCircleItem = ({ item }: { item: FriendCircle }) => (
    <View style={[styles.circleItem, { backgroundColor: colors.card }]}>
      <View style={styles.circleHeader}>
        <Text style={[styles.circleName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.friendCount, { color: colors.textSecondary }]}>
          {item.friends.length} {item.friends.length === 1 ? 'friend' : 'friends'}
        </Text>
      </View>
      
      <View style={styles.circleFriends}>
        {item.friends.slice(0, 3).map((friend) => (
          <View key={friend.id} style={styles.circleFriendChip}>
            <Text style={[styles.circleFriendName, { color: colors.text }]}>
              {friend.name}
            </Text>
          </View>
        ))}
        
        {item.friends.length > 3 && (
          <View style={styles.circleFriendChip}>
            <Text style={[styles.circleFriendName, { color: colors.text }]}>
              +{item.friends.length - 3} more
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.circleActions}>
        <Button 
          title="Edit" 
          variant="outline" 
          size="small" 
          onPress={() => {}} 
          style={styles.circleActionButton}
        />
        <Button 
          title="Delete" 
          variant="outline" 
          size="small" 
          onPress={() => {}} 
          style={styles.circleActionButton}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Friend Circles</Text>
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
          
          <View style={styles.tabs}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'create' && [styles.activeTab, { borderBottomColor: colors.primary }]
              ]}
              onPress={() => setActiveTab('create')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'create' }}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: activeTab === 'create' ? colors.primary : colors.textSecondary }
                ]}
              >
                Create New
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.tab,
                activeTab === 'manage' && [styles.activeTab, { borderBottomColor: colors.primary }]
              ]}
              onPress={() => setActiveTab('manage')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'manage' }}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: activeTab === 'manage' ? colors.primary : colors.textSecondary }
                ]}
              >
                Manage Existing
              </Text>
            </Pressable>
          </View>
          
          {activeTab === 'create' ? (
            <View style={styles.content}>
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Circle Name</Text>
                  <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                    {circleName.length}/30
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border 
                    }
                  ]}
                  placeholder="e.g., Work Friends, Family, etc."
                  placeholderTextColor={colors.textSecondary}
                  value={circleName}
                  onChangeText={(text) => text.length <= 30 && setCircleName(text)}
                  maxLength={30}
                />
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
                  <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                    {circleDescription.length}/150
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.textarea, 
                    { 
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border 
                    }
                  ]}
                  placeholder="What's this circle about?"
                  placeholderTextColor={colors.textSecondary}
                  value={circleDescription}
                  onChangeText={(text) => text.length <= 150 && setCircleDescription(text)}
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Add Friends</Text>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search friends"
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
              
              {selectedFriends.length > 0 && (
                <View style={styles.selectedContainer}>
                  <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>
                    Selected ({selectedFriends.length})
                  </Text>
                  <View style={styles.selectedFriends}>
                    {selectedFriends.map(friend => (
                      <View 
                        key={friend.id} 
                        style={[styles.selectedFriendChip, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}
                      >
                        {friend.avatarUri ? (
                          <Image source={{ uri: friend.avatarUri }} style={styles.chipAvatar} />
                        ) : (
                          <View style={[styles.chipAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.chipAvatarText}>
                              {friend.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.selectedFriendName, { color: colors.text }]}>{friend.name}</Text>
                        <Pressable
                          onPress={() => toggleFriendSelection(friend)}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                          accessibilityLabel={`Remove ${friend.name}`}
                          accessibilityRole="button"
                        >
                          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              <FlatList
                data={filteredFriends}
                renderItem={renderFriendItem}
                keyExtractor={item => item.id}
                style={styles.friendsList}
                contentContainerStyle={styles.friendsListContent}
              />
              
              <View style={styles.footer}>
                <Button 
                  title="Cancel" 
                  variant="outline" 
                  onPress={onClose} 
                  style={styles.footerButton}
                />
                <Button 
                  title="Create Circle" 
                  variant="primary" 
                  onPress={handleCreateCircle} 
                  style={styles.footerButton}
                  isDisabled={!circleName.trim() || selectedFriends.length === 0}
                />
              </View>
            </View>
          ) : (
            <View style={styles.content}>
              {existingCircles.length > 0 ? (
                <FlatList
                  data={existingCircles}
                  renderItem={renderCircleItem}
                  keyExtractor={item => item.id}
                  style={styles.circlesList}
                  contentContainerStyle={styles.circlesListContent}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons 
                    name="people-outline" 
                    size={64} 
                    color={colors.textSecondary} 
                  />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    You haven't created any friend circles yet
                  </Text>
                  <Button 
                    title="Create Your First Circle" 
                    variant="primary" 
                    onPress={() => setActiveTab('create')} 
                    style={styles.emptyStateButton}
                  />
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  selectedContainer: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  selectedFriends: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedFriendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  selectedFriendName: {
    fontSize: 14,
    marginRight: 8,
    marginLeft: 8,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chipAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  friendsList: {
    flex: 1,
  },
  friendsListContent: {
    paddingBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  friendUsername: {
    fontSize: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  circlesList: {
    flex: 1,
  },
  circlesListContent: {
    paddingBottom: 16,
  },
  circleItem: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  circleName: {
    fontSize: 18,
    fontWeight: '600',
  },
  friendCount: {
    fontSize: 14,
  },
  circleFriends: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  circleFriendChip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  circleFriendName: {
    fontSize: 14,
  },
  circleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  circleActionButton: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  emptyStateButton: {
    minWidth: 200,
  },
});
