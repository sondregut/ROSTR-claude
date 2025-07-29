import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCircles } from '@/contexts/CircleContext';

interface Circle {
  id: string;
  name: string;
  memberCount: number;
  members: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  isActive: boolean;
}

interface CircleSelectorProps {
  selectedCircles: string[];
  onCirclesChange: (circles: string[]) => void;
  showPrivateOption?: boolean;
  showAllFriendsOption?: boolean;
}

export function CircleSelector({ 
  selectedCircles, 
  onCirclesChange,
  showPrivateOption = true,
  showAllFriendsOption = true 
}: CircleSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { circles } = useCircles();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAllFriends, setIsAllFriends] = useState(false);
  
  // Transform circles from context to match expected format
  const activeCircles = circles.map(circle => ({
    id: circle.id,
    name: circle.name,
    memberCount: circle.member_count || 0,
    members: [], // We don't need member details for the selector
    isActive: true,
  }));
  
  const toggleCircle = (circleId: string) => {
    if (circleId === 'private') {
      setIsPrivate(!isPrivate);
      setIsAllFriends(false);
      onCirclesChange([]);
    } else if (circleId === 'all-friends') {
      setIsAllFriends(!isAllFriends);
      setIsPrivate(false);
      // Pass special identifier for all friends
      onCirclesChange(isAllFriends ? [] : ['ALL_FRIENDS']);
    } else {
      setIsPrivate(false);
      setIsAllFriends(false);
      if (selectedCircles.includes(circleId)) {
        onCirclesChange(selectedCircles.filter(id => id !== circleId));
      } else {
        onCirclesChange([...selectedCircles, circleId]);
      }
    }
  };
  
  const getTotalMemberCount = () => {
    if (isPrivate) return 0;
    if (isAllFriends || selectedCircles.includes('ALL_FRIENDS')) {
      // Calculate estimated total reach across all circles
      const totalMembers = activeCircles.reduce((sum, circle) => sum + circle.memberCount, 0);
      // Estimate 30% overlap between circles
      const estimatedOverlap = Math.floor(totalMembers * 0.3);
      return Math.max(totalMembers - estimatedOverlap, totalMembers);
    }
    
    const uniqueMembers = new Set<string>();
    selectedCircles.forEach(circleId => {
      const circle = activeCircles.find(c => c.id === circleId);
      circle?.members.forEach(member => uniqueMembers.add(member.id));
    });
    return uniqueMembers.size;
  };
  
  const getSelectedCircleNames = () => {
    if (isPrivate) return ['Private'];
    if (isAllFriends || selectedCircles.includes('ALL_FRIENDS')) {
      const totalReach = getTotalMemberCount();
      return [`All Friends (~${totalReach} people)`];
    }
    return selectedCircles
      .filter(id => id !== 'ALL_FRIENDS') // Filter out special identifier
      .map(id => {
        const circle = activeCircles.find(c => c.id === id);
        if (circle) {
          return `${circle.name} (${circle.memberCount})`;
        }
        return null;
      })
      .filter(Boolean) as string[];
  };
  
  const renderAvatarStack = (members: Circle['members']) => {
    const displayMembers = members.slice(0, 3);
    const remainingCount = members.length - 3;
    
    return (
      <View style={styles.avatarStack}>
        {displayMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatar,
              { 
                backgroundColor: colors.border,
                marginLeft: index > 0 ? -8 : 0,
                zIndex: 3 - index,
              }
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {member.name.charAt(0)}
            </Text>
          </View>
        ))}
        {remainingCount > 0 && (
          <View
            style={[
              styles.avatar,
              { 
                backgroundColor: colors.textSecondary,
                marginLeft: -8,
                zIndex: 0,
              }
            ]}
          >
            <Text style={[styles.avatarText, { color: 'white', fontSize: 10 }]}>
              +{remainingCount}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  const renderCircle = ({ item }: { item: Circle | { id: string; name: string; isPrivate?: boolean; isAllFriends?: boolean } }) => {
    const isSelected = 'isPrivate' in item ? isPrivate : 'isAllFriends' in item ? isAllFriends : selectedCircles.includes(item.id);
    const isCircle = !('isPrivate' in item) && !('isAllFriends' in item);
    
    return (
      <Pressable
        style={[
          styles.circleItem,
          { 
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => toggleCircle(item.id)}
      >
        <View style={styles.circleHeader}>
          <View style={styles.circleInfo}>
            {'isAllFriends' in item && (
              <Ionicons name="globe-outline" size={20} color={colors.primary} style={styles.circleIcon} />
            )}
            {'isPrivate' in item && (
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.circleIcon} />
            )}
            <View>
              <Text style={[styles.circleName, { color: colors.text }]}>{item.name}</Text>
              {isCircle && 'memberCount' in item && (
                <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                  {item.memberCount} members
                </Text>
              )}
              {'isAllFriends' in item && (
                <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                  Reach everyone across all circles
                </Text>
              )}
            </View>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </View>
        
        {isCircle && 'members' in item && renderAvatarStack(item.members)}
      </Pressable>
    );
  };
  
  const selectedNames = getSelectedCircleNames();
  const totalMembers = getTotalMemberCount();
  
  return (
    <>
      <Pressable
        style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          {selectedNames.length > 0 ? (
            <View>
              <Text style={[styles.selectedText, { color: colors.text }]}>
                {selectedNames.join(', ')}
              </Text>
              {!isPrivate && totalMembers > 0 && (
                <Text style={[styles.memberCountText, { color: colors.textSecondary }]}>
                  {totalMembers} people will see this
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Select circles to share with
            </Text>
          )}
        </View>
        <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
      </Pressable>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Share With</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          
          <FlatList
            data={[
              ...(showPrivateOption ? [{ id: 'private', name: 'Private (Only Me)', isPrivate: true }] : []),
              ...(showAllFriendsOption ? [{ id: 'all-friends', name: 'All Friends', isAllFriends: true }] : []),
              ...activeCircles
            ]}
            renderItem={renderCircle}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {showPrivateOption || showAllFriendsOption ? 'Sharing Options' : 'Your Circles'}
                </Text>
              </View>
            }
            ListFooterComponent={
              <Pressable
                style={[styles.createCircleButton, { borderColor: colors.border }]}
                onPress={() => {
                  setModalVisible(false);
                  // Navigate to create circle
                  console.log('Create new circle');
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.createCircleText, { color: colors.primary }]}>
                  Create New Circle
                </Text>
              </Pressable>
            }
          />
          
          <View style={[styles.modalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.footerTitle, { color: colors.text }]}>
                {isPrivate ? 'Private Entry' : 
                 isAllFriends || selectedCircles.includes('ALL_FRIENDS') ? 'Sharing with All Friends' :
                 `Sharing with ${selectedNames.length} circle${selectedNames.length !== 1 ? 's' : ''}`}
              </Text>
              {!isPrivate && totalMembers > 0 && (
                <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>
                  {isAllFriends || selectedCircles.includes('ALL_FRIENDS') ? 
                    `~${totalMembers} people will see this update` :
                    `${totalMembers} people will see this update`}
                </Text>
              )}
            </View>
            <Pressable
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorContent: {
    flex: 1,
    marginRight: 8,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberCountText: {
    fontSize: 14,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  circleItem: {
    padding: 16,
    borderRadius: 12,
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  circleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circleIcon: {
    marginRight: 12,
  },
  circleName: {
    fontSize: 18,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 14,
    marginTop: 2,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createCircleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  createCircleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});