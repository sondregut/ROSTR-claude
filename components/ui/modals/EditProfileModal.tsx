import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/buttons/Button';
import { useColorScheme } from '@/hooks/useColorScheme';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  children: React.ReactNode;
}

export function EditProfileModal({
  visible,
  onClose,
  onSave,
  title,
  children,
}: EditProfileModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Modal
      visible={visible}
      animationType="none"
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
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {title}
                </Text>
                <Pressable onPress={onSave} style={styles.saveButton}>
                  <Text style={[styles.saveText, { color: colors.primary }]}>
                    Save
                  </Text>
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
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
  },
  keyboardAvoid: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});