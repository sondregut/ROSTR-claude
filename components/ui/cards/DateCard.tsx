import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { PollVoting } from '../feed/PollVoting';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DateCardProps {
  id: string;
  personName: string;
  date: string;
  location: string;
  rating?: number;
  notes?: string;
  imageUri?: string;
  tags?: string[];
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
  poll,
  userPollVote = null,
  comments = [],
  onPress,
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
        <View style={styles.avatarContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarInitial, { color: colors.buttonText }]}>
                {personName.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.personName, { color: colors.primary }]}>{personName}</Text>
          <Text style={[styles.dateTime, { color: colors.textSecondary }]}>{date}</Text>
        </View>
      </View>

      {rating > 0 && (
        <Text style={[styles.rating, { color: colors.primary }]}>
          {formatRating(rating)}
        </Text>
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
                  backgroundColor: colors.tagBackground, 
                  borderRadius: 12, 
                  paddingHorizontal: 10, 
                  paddingVertical: 5 
                }
              ]}
            >
              <Text style={[styles.tagText, { color: colors.tagText }]}>{tag}</Text>
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
            <View 
              key={index} 
              style={[
                styles.comment, 
                { 
                  backgroundColor: colors.commentBackground,
                  marginBottom: index === comments.length - 1 ? 0 : 12
                }
              ]}
            >
              <Text style={[styles.commentName, { color: colors.text }]}>{comment.name}</Text>
              <Text style={[styles.commentContent, { color: colors.text }]}>{comment.content}</Text>
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
    paddingBottom: 8,
    alignItems: 'center',
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
  },
  rating: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    marginTop: 12,
  },
  comment: {
    padding: 12,
    borderRadius: 8,
  },
  commentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
});
