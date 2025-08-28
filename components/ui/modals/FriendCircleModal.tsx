import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  FlatList, 
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableModal } from '@/components/navigation/SwipeableModal';
import { pickImageWithCrop } from '@/lib/photoUpload';
import { Button } from '../buttons/Button';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { EnhancedContactModal } from './EnhancedContactModal';
import { UserSearchModal } from '../search/UserSearchModal';

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
  onCreateCircle: (circleName: string, description: string, friendIds: string[], groupPhotoUri?: string) => void;
  friends?: Friend[];
  existingCircles?: FriendCircle[];
}

export function FriendCircleModal({
  visible,
  onClose,
  onCreateCircle,
  friends = [],
  existingCircles = [],
}: FriendCircleModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupPhotoUri, setGroupPhotoUri] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  
  const toggleFriendSelection = (friend: Friend) => {
    const isAlreadySelected = selectedFriends.some(f => f.id === friend.id);
    
    if (isAlreadySelected) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };
  
  const clearSelection = () => {
    setSelectedFriends([]);
  };
  
  const selectAllFilteredFriends = () => {
    if (!filteredFriends || filteredFriends.length === 0) return;
    const allFilteredFriends = filteredFriends.filter(f => !selectedFriends.some(sf => sf.id === f.id));
    setSelectedFriends([...selectedFriends, ...allFilteredFriends]);
  };
  
  const hasUnselectedFriends = filteredFriends && filteredFriends.length > 0 && filteredFriends.some(f => !selectedFriends.some(sf => sf.id === f.id));
  
  const handleImagePick = async () => {
    try {
      const result = await pickImageWithCrop('library', {
        aspect: [1, 1], // Square aspect ratio for group photos
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (result.success && result.uri) {
        setGroupPhotoUri(result.uri);
      } else if (result.error && result.error !== 'Selection cancelled') {
        alert(`Failed to pick image: ${result.error}`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const removeGroupPhoto = () => {
    setGroupPhotoUri(null);
  };

  const handleCreateCircle = async () => {
    if (circleName.trim() && !isCreating) {
      setIsCreating(true);
      try {
        await onCreateCircle(
          circleName,
          circleDescription,
          selectedFriends.map(friend => friend.id),
          groupPhotoUri || undefined
        );
        resetForm();
      } catch (error) {
        console.error('Error creating circle:', error);
        const errorMessage = error.message?.includes('permission')
          ? 'Permission denied. Please try again later.'
          : error.message?.includes('network')
          ? 'Network error. Please check your connection.'
          : 'Failed to create circle. Please try again.';
          
        Alert.alert('Error', errorMessage);
        setIsCreating(false);
      }
    }
  };
  
  const resetForm = () => {
    setCircleName('');
    setCircleDescription('');
    setSelectedFriends([]);
    setSearchQuery('');
    setGroupPhotoUri(null);
    setIsCreating(false);
    setIsContactModalVisible(false);
    setIsSearchModalVisible(false);
  };
  
  const handleNewFriendAdded = () => {
    // This callback would be used to refresh the friends list
    // For now, we'll just close modals since the friend list comes from parent
    setIsContactModalVisible(false);
    setIsSearchModalVisible(false);
  };
  
  const filteredFriends = (friends || []).filter(friend => 
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
          isSelected && { 
            backgroundColor: `${colors.primary}15`, 
            borderColor: colors.primary,
            borderWidth: 1
          }
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
          { borderColor: colors.border },
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
    <SwipeableModal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onSwipeDown={onClose}
      swipeToCloseEnabled={true}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {selectedFriends.length > 0 ? `Friend Circles (${selectedFriends.length} selected)` : 'Friend Circles'}
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
        
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
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
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {activeTab === 'create' ? (
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
                  <Text style={[styles.label, { color: colors.text }]}>Group Photo (Optional)</Text>
                  
                  {groupPhotoUri ? (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: groupPhotoUri }} style={styles.groupPhoto} />
                      <Pressable
                        style={styles.removePhotoButton}
                        onPress={removeGroupPhoto}
                        accessibilityLabel="Remove group photo"
                        accessibilityRole="button"
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error || '#FF3B30'} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.photoUploadButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={handleImagePick}
                      accessibilityLabel="Add group photo"
                      accessibilityRole="button"
                    >
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                      <Text style={[styles.photoUploadText, { color: colors.textSecondary }]}>
                        Add Group Photo
                      </Text>
                    </Pressable>
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Add Friends</Text>
                  
                  {friends.length > 0 ? (
                    <>
                      {/* Search Bar for existing friends */}
                      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="search" size={20} color={colors.textSecondary} />
                        <TextInput
                          style={[styles.searchInput, { color: colors.text }]}
                          placeholder="Search your friends"
                          placeholderTextColor={colors.textSecondary}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                        />
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.noFriendsText, { color: colors.textSecondary }]}>
                      You don't have any friends yet. Find some to add to your circle!
                    </Text>
                  )}
                </View>
                
                {/* Selected Friends Display */}
                {selectedFriends.length > 0 && (
                  <View style={styles.selectedContainer}>
                    <Text style={[styles.selectedLabel, { color: colors.text }]}>
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
                
                {/* Existing Friends List */}
                {friends.length > 0 && (
                  <FlatList
                    data={filteredFriends}
                    renderItem={renderFriendItem}
                    keyExtractor={item => item.id}
                    style={styles.friendsList}
                    contentContainerStyle={styles.friendsListContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                      <View style={styles.friendsListHeader}>
                        <View style={styles.friendsHeaderRow}>
                          <Text style={[styles.friendsListTitle, { color: colors.text }]}>
                            Your Friends ({filteredFriends.length})
                          </Text>
                          {filteredFriends.length > 0 && (
                            <View style={styles.quickActions}>
                              {hasUnselectedFriends && (
                                <Pressable
                                  onPress={selectAllFilteredFriends}
                                  style={[styles.quickActionButton, { borderColor: colors.primary }]}
                                >
                                  <Text style={[styles.quickActionText, { color: colors.primary }]}>Select All</Text>
                                </Pressable>
                              )}
                              {selectedFriends.length > 0 && (
                                <Pressable
                                  onPress={clearSelection}
                                  style={[styles.quickActionButton, { borderColor: colors.textSecondary }]}
                                >
                                  <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Clear</Text>
                                </Pressable>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  />
                )}
                
                {/* Find More Friends Section */}
                <View style={styles.discoverySection}>
                  <Text style={[styles.discoveryTitle, { color: colors.text }]}>
                    {friends.length === 0 ? 'Find Friends' : 'Find More Friends'}
                  </Text>
                  <Text style={[styles.discoveryText, { color: colors.textSecondary }]}>
                    {friends.length === 0 
                      ? 'Get started by finding friends to add to your circle:'
                      : 'Add more friends from contacts or search:'}
                  </Text>
                  
                  <View style={styles.discoveryActions}>
                    <Pressable
                      style={[styles.discoveryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => setIsContactModalVisible(true)}
                    >
                      <Ionicons name="people" size={20} color={colors.primary} />
                      <Text style={[styles.discoveryButtonText, { color: colors.text }]}>Find from Contacts</Text>
                    </Pressable>
                    
                    <Pressable
                      style={[styles.discoveryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => setIsSearchModalVisible(true)}
                    >
                      <Ionicons name="search" size={20} color={colors.primary} />
                      <Text style={[styles.discoveryButtonText, { color: colors.text }]}>Search Username</Text>
                    </Pressable>
                  </View>
                </View>
                    
                    <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                      <Button 
                        title="Cancel" 
                        variant="outline" 
                        onPress={onClose} 
                        style={styles.footerButton}
                      />
                      <Button 
                        title={isCreating ? "Creating Circle..." : "Create Circle"} 
                        variant="primary" 
                        onPress={handleCreateCircle} 
                        style={[styles.footerButton, { opacity: !circleName.trim() ? 0.5 : 1 }]}
                        disabled={!circleName.trim() || isCreating}
                        loading={isCreating}
                      />
                    </View>
                </ScrollView>
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
            </KeyboardAvoidingView>
            
            {/* Enhanced Contact Modal */}
            <EnhancedContactModal
              visible={isContactModalVisible}
              onClose={() => setIsContactModalVisible(false)}
              onInvitesSent={(count) => {
                console.log(`Sent invites to ${count} contacts`);
              }}
              onFriendsAdded={(count) => {
                console.log(`Added ${count} friends`);
                handleNewFriendAdded();
              }}
            />

            {/* User Search Modal */}
            <UserSearchModal
              visible={isSearchModalVisible}
              onClose={() => setIsSearchModalVisible(false)}
              onFriendAdded={handleNewFriendAdded}
            />
      </SafeAreaView>
    </SwipeableModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16, // Space from tabs
    paddingBottom: 100, // Space for footer
    paddingHorizontal: 16, // Horizontal padding for all content
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    paddingHorizontal: 16,
    paddingTop: 16,
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
    marginBottom: 12,
  },
  noFriendsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  friendsListHeader: {
    marginBottom: 12,
  },
  friendsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendsListTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  discoverySection: {
    marginTop: 20,
    marginBottom: 16,
  },
  discoveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  discoveryText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  discoveryActions: {
    gap: 12,
  },
  discoveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  discoveryButtonText: {
    fontSize: 15,
    fontWeight: '500',
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
    marginTop: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
    backgroundColor: 'transparent',
  },
  footerButton: {
    flex: 1,
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
  photoContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 8,
  },
  groupPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  photoUploadButton: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoUploadText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});
