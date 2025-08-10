import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { openInstagramProfile, getDisplayUsername } from '@/lib/instagramUtils';
import { InlineComments } from '../feed/InlineComments';
import { getEmojiById } from '@/constants/ReactionData';
import * as Haptics from 'expo-haptics';
import { Image } from 'react-native';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface RosterCardProps {
  id: string;
  personName: string;
  date: string; // Relative time like "2h ago"
  authorName: string;
  authorAvatar?: string;
  isOwnPost?: boolean;
  imageUri?: string;
  rosterInfo?: {
    age?: number;
    occupation?: string;
    howWeMet?: string;
    interests?: string;
    instagram?: string;
    phone?: string;
    photos?: string[];
  };
  onPress?: () => void;
  onPersonPress?: () => void;
  onAuthorPress?: () => void;
  onLike?: () => void;
  onReact?: (reaction: string | null) => void;
  onSubmitComment?: (text: string) => Promise<void>;
  onEdit?: () => void;
  onCommentFocus?: () => void;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  reactions?: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
  userReaction?: string | null;
  comments?: {
    name: string;
    content: string;
    imageUri?: string;
  }[];
}

export function RosterCard({
  id,
  personName,
  date,
  authorName,
  authorAvatar,
  isOwnPost = false,
  imageUri,
  rosterInfo,
  onPress,
  onPersonPress,
  onAuthorPress,
  onLike,
  onReact,
  onSubmitComment,
  onEdit,
  onCommentFocus,
  likeCount,
  commentCount,
  isLiked = false,
  reactions = {},
  userReaction = null,
  comments = [],
}: RosterCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showComments, setShowComments] = useState(comments && comments.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.avatarContainer}
          onPress={onAuthorPress}
        >
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarInitial, { color: colors.buttonText }]}>
                {authorName.charAt(0)}
              </Text>
            </View>
          )}
        </Pressable>
        <View style={styles.headerInfo}>
          <Pressable onPress={onAuthorPress}>
            <Text style={[styles.authorName, { color: colors.text }]}>
              {authorName}
            </Text>
          </Pressable>
          <View style={styles.actionRow}>
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              added
            </Text>
            <Pressable onPress={onPersonPress}>
              <Text style={[styles.personName, { color: colors.primary }]}>
                {personName}
              </Text>
            </Pressable>
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              to their roster
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.dateTime, { color: colors.textSecondary }]}>{date}</Text>
          {isOwnPost && onEdit && (
            <Pressable 
              onPress={onEdit}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Roster Info Card */}
      <View style={[styles.personCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.personHeader}>
          {imageUri ? (
            <OptimizedImage source={{ uri: imageUri }} style={styles.personImage} priority="high" />
          ) : (
            <View style={[styles.personImagePlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.personInitial, { color: colors.buttonText }]}>
                {personName.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.personInfo}>
            <Pressable onPress={onPersonPress}>
              <Text style={[styles.personCardName, { color: colors.text }]}>
                {personName}
              </Text>
            </Pressable>
            {rosterInfo?.age && (
              <Text style={[styles.personDetail, { color: colors.textSecondary }]}>
                {rosterInfo.age} years old
              </Text>
            )}
            {rosterInfo?.occupation && (
              <Text style={[styles.personDetail, { color: colors.textSecondary }]}>
                {rosterInfo.occupation}
              </Text>
            )}
            {rosterInfo?.instagram && (
              <Pressable 
                onPress={() => openInstagramProfile(rosterInfo.instagram!)}
                style={styles.instagramButton}
              >
                <Ionicons name="logo-instagram" size={14} color={colors.primary} />
                <Text style={[styles.instagramText, { color: colors.primary }]}>
                  {getDisplayUsername(rosterInfo.instagram)}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        
        {rosterInfo?.howWeMet && (
          <View style={styles.metSection}>
            <Text style={[styles.metLabel, { color: colors.textSecondary }]}>How they met:</Text>
            <Text style={[styles.metText, { color: colors.text }]}>
              {rosterInfo.howWeMet}
            </Text>
          </View>
        )}
        
        {rosterInfo?.interests && (
          <View style={styles.interestsSection}>
            <Text style={[styles.interestsLabel, { color: colors.textSecondary }]}>Interests:</Text>
            <Text style={[styles.interestsText, { color: colors.text }]}>
              {rosterInfo.interests}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={[styles.actionsContainer, { borderTopColor: colors.border }]}>
        <Pressable 
          style={styles.actionButton}
          onPress={() => {
            // Quick tap toggle logic
            if (onReact) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // If any reaction exists, remove it. Otherwise add love
              onReact(userReaction ? null : 'love');
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="React"
        >
          {userReaction ? (
            <Text style={styles.reactionEmoji}>
              {getEmojiById(userReaction)}
            </Text>
          ) : (
            <Ionicons 
              name="heart-outline" 
              size={20} 
              color={colors.textSecondary} 
            />
          )}
          <Text 
            style={[
              styles.actionButtonText, 
              { color: userReaction ? colors.primary : colors.textSecondary }
            ]}
          >
            {likeCount > 0 ? likeCount : 'React'}
          </Text>
        </Pressable>
        
        <Pressable 
          style={styles.actionButton} 
          onPress={() => {
            console.log(' RosterCard: Comment button pressed for:', personName, 'ID:', id);
            setShowComments(!showComments);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={showComments ? "chatbubble" : "chatbubble-outline"} size={20} color={showComments ? colors.primary : colors.textSecondary} />
          <Text style={[styles.actionButtonText, { color: showComments ? colors.primary : colors.textSecondary }]}>
            {commentCount > 0 ? `${commentCount} Comment${commentCount > 1 ? 's' : ''}` : 'Comment'}
          </Text>
        </Pressable>
      </View>

      {/* Inline Comments Section */}
      <InlineComments
        comments={comments || []}
        isExpanded={showComments}
        onSubmitComment={onSubmitComment || (async () => {})}
        onFocus={onCommentFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginTop: 0,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
  },
  personName: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dateTime: {
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    marginTop: 4,
    padding: 4,
  },
  personCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  personImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  personImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  personInfo: {
    flex: 1,
  },
  personCardName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  personDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  instagramText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  metSection: {
    marginBottom: 8,
  },
  metLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  metText: {
    fontSize: 14,
  },
  interestsSection: {
    marginBottom: 8,
  },
  interestsLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  interestsText: {
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  commentsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  commentRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentBubble: {
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  commentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 18,
  },
  reactionEmoji: {
    fontSize: 20,
  },
});