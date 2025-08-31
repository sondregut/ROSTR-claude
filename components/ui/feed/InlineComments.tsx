import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
 Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeUser } from '@/hooks/useSafeUser';

interface Comment {
  id?: string;
  name: string;
  content: string;
  imageUri?: string;
  isOptimistic?: boolean;
}

interface InlineCommentsProps {
  comments: Comment[];
  onSubmitComment: (text: string) => Promise<void>;
  isExpanded: boolean;
  placeholder?: string;
  onFocus?: () => void;
  autoFocus?: boolean;
}

export function InlineComments({
  comments,
  onSubmitComment,
  isExpanded,
  placeholder = "Write a comment...",
  onFocus,
  autoFocus = false
}: InlineCommentsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useSafeUser();
  const userProfile = user?.userProfile;
  const inputRef = useRef<TextInput>(null);
  const previouslyExpanded = useRef(isExpanded);

  // Auto-focus when comments are expanded
  useEffect(() => {
    if (isExpanded && !previouslyExpanded.current && inputRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    previouslyExpanded.current = isExpanded;
  }, [isExpanded]);

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitComment(commentText.trim());
      setCommentText('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) return null;

  return (
    <View style={styles.container}>
      {/* Existing Comments */}
      {comments.length > 0 && (
        <View style={styles.commentsList}>
          {comments.map((comment, index) => (
            <View key={comment.id || index} style={styles.commentItem}>
              {comment.imageUri ? (
                <Image source={{ uri: comment.imageUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                  <Text style={[styles.avatarInitial, { color: colors.text }]}>
                    {comment.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={[styles.commentContent, { backgroundColor: colors.background }]}>
                <Text style={[styles.commentName, { color: colors.text }]}>
                  {comment.name}
                </Text>
                <Text style={[styles.commentText, { color: colors.text, opacity: comment.isOptimistic ? 0.7 : 1 }]}>
                  {comment.content}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        {userProfile?.imageUri ? (
          <Image source={{ uri: userProfile.imageUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
            <Text style={[styles.avatarInitial, { color: colors.text }]}>
              {userProfile?.name?.charAt(0).toUpperCase() || 'Y'}
            </Text>
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={[styles.input, { 
            backgroundColor: colors.inputBackground || colors.border, 
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          editable={!isSubmitting}
          onSubmitEditing={handleSubmit}
          blurOnSubmit={false}
          onFocus={onFocus}
          autoFocus={autoFocus}
        />
        <Pressable
          style={[styles.sendButton, { 
            backgroundColor: commentText.trim() && !isSubmitting ? colors.primary : colors.buttonDisabled,
          }]}
          onPress={handleSubmit}
          disabled={!commentText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={18} color="white" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  commentsList: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
    fontSize: 14,
    minHeight: 36,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});