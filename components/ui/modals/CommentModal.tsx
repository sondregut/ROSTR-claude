import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Comment {
  id: string;
  name: string;
  content: string;
}

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitComment: (text: string) => Promise<void>;
  dateId: string;
  personName: string;
  existingComments?: Comment[];
}

export function CommentModal({
  visible,
  onClose,
  onSubmitComment,
  dateId,
  personName,
  existingComments = [],
}: CommentModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Log when modal is rendered
  console.log('🔍 CommentModal rendered with:', { 
    visible, 
    dateId, 
    personName,
    commentCount: existingComments.length 
  });

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (comment.trim()) {
      setIsSubmitting(true);
      
      try {
        await onSubmitComment(comment.trim());
        setComment('');
        
      } catch (error) {
        console.error('Comment submission failed:', error);
        Alert.alert(
          'Comment Failed', 
          'Failed to add comment. Please check your connection and try again.',
          [{ text: 'OK', style: 'default' }]
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      Alert.alert('Empty Comment', 'Please enter a comment before submitting.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Comments on {personName}'s date
                </Text>
                <View style={styles.headerRight} />
              </View>

              {/* Comments List */}
              <ScrollView style={styles.commentsList}>
                {existingComments.length > 0 ? (
                  existingComments.map((comment) => (
                    <View key={comment.id} style={[styles.commentItem, { backgroundColor: colors.commentBackground, borderBottomColor: 'transparent' }]}>
                      <Text style={[styles.commentName, { color: colors.text }]}>
                        {comment.name}
                      </Text>
                      <Text style={[styles.commentContent, { color: colors.text }]}>
                        {comment.content}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyComments}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No comments yet. Be the first to comment!
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Comment Input */}
              <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.textSecondary}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={500}
                />
                <Pressable
                  style={[
                    styles.submitButton,
                    { backgroundColor: (comment.trim() && !isSubmitting) ? colors.primary : colors.buttonDisabled }
                  ]}
                  onPress={handleSubmit}
                  disabled={!comment.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="send" size={20} color="white" />
                  )}
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 32,
  },
  commentsList: {
    flex: 1,
    padding: 16,
  },
  commentItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});