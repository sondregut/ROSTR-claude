import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { PollVoting } from '../feed/PollVoting';
import { useColorScheme } from '@/hooks/useColorScheme';
import { openInstagramProfile, getDisplayUsername } from '@/lib/instagramUtils';

interface DateCardProps {
  id: string;
  personName: string;
  date: string;
  location: string;
  rating?: number;
  notes?: string;
  imageUri?: string;
  tags?: string[];
  instagramUsername?: string;
  authorName?: string;
  authorAvatar?: string;
  poll?: {
    question: string;
    options: {
      text: string;
      votes: number;
    }[];
  };
  userPollVote?: number | null;
  comments?: {
    name: string;
    content: string;
  }[];
  onPress?: () => void;
  onPersonPress?: () => void;
  onPersonHistoryPress?: () => void;
  onAuthorPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onPollVote?: (dateId: string, optionIndex: number) => void;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

export function DateCard({
  id,
  personName,
  date,
  location,
  rating = 0,
  notes,
  imageUri,
  tags = [],
  instagramUsername,
  authorName,
  authorAvatar,
  poll,
  userPollVote = null,
  comments = [],
  onPress,
  onPersonPress,
  onPersonHistoryPress,
  onAuthorPress,
  onLike,
  onComment,
  onPollVote,
  likeCount,
  commentCount,
  isLiked = false,
}: DateCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatRating = (rating: number) => {
    return rating.toFixed(1) + '/5';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Pressable 
          style={styles.avatarContainer}
          onPress={authorName ? onAuthorPress : onPersonPress}
        >
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarInitial, { color: colors.buttonText }]}>
                {(authorName || personName).charAt(0)}
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable 
          style={styles.headerInfo}
          onPress={authorName ? onAuthorPress : onPersonPress}
        >
          <View style={styles.nameRow}>
            <Text style={[styles.personName, { color: colors.text }]}>
              {authorName || personName}
            </Text>
          </View>
        </Pressable>
        <Text style={[styles.dateTime, { color: colors.textSecondary }]}>{date}</Text>
      </View>

      {/* Rating with clickable person name */}
      {rating > 0 && (
        <View style={styles.ratingWithPersonContainer}>
          <View style={styles.ratingWithPersonRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.primary }]}>
              {formatRating(rating)}
            </Text>
            <Text style={[styles.dateSeparator, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.dateWithText, { color: colors.textSecondary }]}>Date with</Text>
            <Pressable onPress={() => {
              // If this is a friend's date (has authorName), we need to navigate differently
              if (onPersonHistoryPress) {
                onPersonHistoryPress();
              }
            }}>
              <Text style={[styles.clickablePersonName, { color: colors.primary }]}>
                {personName}
              </Text>
            </Pressable>
            {instagramUsername && (
              <Pressable 
                onPress={() => openInstagramProfile(instagramUsername)}
                style={styles.instagramButtonInline}
                accessibilityLabel={`Open ${personName}'s Instagram profile`}
                accessibilityRole="button"
              >
                <Ionicons name="logo-instagram" size={12} color={colors.primary} />
                <Text style={[styles.instagramUsernameInline, { color: colors.primary }]}>
                  {getDisplayUsername(instagramUsername)}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}


      {notes && (
        <Text style={[styles.notes, { color: colors.text }]}>
          {notes}
        </Text>
      )}

      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View 
              key={index} 
              style={[
                styles.tag, 
                { 
                  backgroundColor: '#FFE5E5', 
                  borderRadius: 12, 
                  paddingHorizontal: 12, 
                  paddingVertical: 6 
                }
              ]}
            >
              <Text style={[styles.tagText, { color: '#E91E63' }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {poll && (
        <View style={styles.pollWrapper}>
          <PollVoting
            question={poll.question}
            options={poll.options}
            userVote={userPollVote}
            onVote={(optionIndex) => {
              if (onPollVote) {
                onPollVote(id, optionIndex);
              }
            }}
            allowVoting={true}
          />
        </View>
      )}

      <View style={[styles.actionsContainer, { borderTopColor: colors.border }]}>
        <Pressable 
          style={styles.actionButton} 
          onPress={onLike}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={isLiked ? "Unlike" : "Like"}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked ? colors.primary : colors.textSecondary} 
          />
          <Text 
            style={[
              styles.actionText, 
              { color: isLiked ? colors.primary : colors.textSecondary }
            ]}
          >
            {likeCount > 0 ? likeCount : 'Like'}
          </Text>
        </Pressable>
        
        <Pressable 
          style={styles.actionButton} 
          onPress={onComment}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Comment"
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {commentCount > 0 ? `${commentCount} Comment${commentCount > 1 ? 's' : ''}` : 'Comment'}
          </Text>
        </Pressable>
      </View>

      {comments.length > 0 && (
        <View style={styles.commentsContainer}>
          {comments.map((comment, index) => (
            <View key={index} style={styles.commentRow}>
              <View style={styles.commentBubble}>
                <Text style={[styles.commentName, { color: colors.text }]}>{comment.name}</Text>
                <Text style={[styles.commentContent, { color: colors.text }]}>{comment.content}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateTime: {
    fontSize: 14,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 4,
  },
  rating: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 4,
  },
  notes: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pollWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  actionText: {
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
    backgroundColor: '#F5F5F5',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  instagramUsername: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 2,
  },
  ratingWithPersonContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  ratingWithPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateSeparator: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  dateWithText: {
    fontSize: 14,
  },
  clickablePersonName: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  instagramButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  instagramUsernameInline: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
});
