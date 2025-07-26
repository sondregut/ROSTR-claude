import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Pressable, 
  FlatList, 
  TextInput,
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
  onCreateCircle: (circleName: string, friendIds: string[]) => void;
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
        selectedFriends.map(friend => friend.id)
      );
      resetForm();
    }
  };
  
  const resetForm = () => {
    setCircleName('');
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
              <View style={styles.avatar}>
                {/* Avatar image would go here */}
              </View>
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
                <Text style={[styles.label, { color: colors.text }]}>Circle Name</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border 
                    }
                  ]}
                  placeholder="Enter circle name"
                  placeholderTextColor={colors.textSecondary}
                  value={circleName}
                  onChangeText={setCircleName}
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
                        style={[styles.selectedFriendChip, { backgroundColor: colors.primary }]}
                      >
                        <Text style={styles.selectedFriendName}>{friend.name}</Text>
                        <Pressable
                          onPress={() => toggleFriendSelection(friend)}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                          accessibilityLabel={`Remove ${friend.name}`}
                          accessibilityRole="button"
                        >
                          <Ionicons name="close-circle" size={16} color="white" />
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
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFriendName: {
    color: 'white',
    fontSize: 14,
    marginRight: 4,
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
