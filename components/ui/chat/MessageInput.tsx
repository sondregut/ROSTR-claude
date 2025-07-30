import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping?: () => void;
  placeholder?: string;
  maxLength?: number;
}

export function MessageInput({ 
  onSendMessage, 
  onTyping,
  placeholder = "Type a message...",
  maxLength = 500 
}: MessageInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    
    onSendMessage(message.trim());
    setMessage('');
    setInputHeight(40);
    
    // Keep keyboard open
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    onTyping?.();
  };

  const handleContentSizeChange = (event: any) => {
    const { contentSize } = event.nativeEvent;
    // Limit height to ~4 lines
    const newHeight = Math.min(Math.max(40, contentSize.height), 100);
    setInputHeight(newHeight);
  };

  const remainingChars = maxLength - message.length;
  const showCharCount = remainingChars < 50;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          minHeight: inputHeight + 20,
        }
      ]}>
        {/* Attachment button */}
        <Pressable 
          style={styles.iconButton}
          onPress={() => {
            // TODO: Implement image picker
            console.log('Add attachment');
          }}
        >
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
        </Pressable>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            { 
              color: colors.text,
              height: inputHeight,
            }
          ]}
          value={message}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={maxLength}
          onContentSizeChange={handleContentSizeChange}
          onSubmitEditing={(e) => {
            // Only send on Enter without Shift
            if (!e.nativeEvent.text.includes('\n')) {
              handleSend();
            }
          }}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        {/* Character count */}
        {showCharCount && (
          <Text style={[
            styles.charCount,
            { color: remainingChars < 20 ? colors.error : colors.textSecondary }
          ]}>
            {remainingChars}
          </Text>
        )}

        {/* Emoji button */}
        <Pressable 
          style={styles.iconButton}
          onPress={() => {
            // TODO: Implement emoji picker
            console.log('Add emoji');
          }}
        >
          <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Send button */}
      <Pressable
        style={[
          styles.sendButton,
          {
            backgroundColor: message.trim() ? colors.primary : colors.border,
          }
        ]}
        onPress={handleSend}
        disabled={!message.trim()}
      >
        <Ionicons 
          name="send" 
          size={20} 
          color={message.trim() ? 'white' : colors.textSecondary} 
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 100,
  },
  charCount: {
    fontSize: 12,
    marginRight: 4,
    marginBottom: 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});