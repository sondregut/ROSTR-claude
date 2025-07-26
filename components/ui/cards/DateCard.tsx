import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';

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
  comments?: {
    author: string;
    text: string;
  }[];
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

export function DateCard({
  personName,
  date,
  location,
  rating = 0,
  notes,
  imageUri,
  tags = [],
  poll,
  comments = [],
  onPress,
  onLike,
  onComment,
  likeCount,
  commentCount,
  isLiked = false,
}: DateCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatRating = (rating: number) => {
    return rating.toFixed(1) + '/5';
  };

  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getTotalVotes = () => {
    if (!poll) return 0;
    return poll.options.reduce((acc, option) => acc + option.votes, 0);
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
        <View style={[styles.pollContainer, { backgroundColor: colors.pollBackground }]}>
          <Text style={[styles.pollQuestion, { color: colors.text }]}>{poll.question}</Text>
          {poll.options.map((option, index) => {
            const totalVotes = getTotalVotes();
            const percentage = calculatePercentage(option.votes, totalVotes);
            
            return (
              <View key={index} style={styles.pollOption}>
                <View style={styles.pollTextContainer}>
                  <Text style={[styles.pollOptionText, { color: colors.text }]}>{option.text}</Text>
                  <Text style={[styles.pollVotes, { color: colors.textSecondary }]}>
                    {option.votes} ({percentage}%)
                  </Text>
                </View>
                <View 
                  style={[
                    styles.pollBarBackground, 
                    { 
                      height: 10, 
                      backgroundColor: colors.pollBarBackground, 
                      borderRadius: 5 
                    }
                  ]}
                >
                  <View 
                    style={[
                      styles.pollBar, 
                      { 
                        height: '100%', 
                        backgroundColor: colors.pollBar, 
                        borderRadius: 5, 
                        width: `${percentage}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })}
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
        <View 
          style={[
            styles.commentsContainer, 
            { 
              marginTop: 12, 
              backgroundColor: colors.pollBackground, 
              borderTopColor: colors.border 
            }
          ]}
        >
          {comments.map((comment, index) => (
            <View key={index} style={styles.comment}>
              <Text style={[styles.commentAuthor, { color: colors.text }]}>{comment.author}</Text>
              <Text style={[styles.commentText, { color: colors.textSecondary }]}>{comment.text}</Text>
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
    borderColor: '#f0f0f0',
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
  pollContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pollOption: {
    marginBottom: 12,
  },
  pollTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pollOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pollVotes: {
    fontSize: 14,
  },
  pollBarBackground: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  pollBar: {
    height: '100%',
    borderRadius: 5,
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
    marginTop: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderTopWidth: 1,
  },
  comment: {
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
  },
});
