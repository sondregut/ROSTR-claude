import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DateEntry } from '@/contexts/DateContext';

interface EditDateModalProps {
  visible: boolean;
  date: DateEntry | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<DateEntry>) => void;
  onDelete?: (id: string) => void;
}

export function EditDateModal({ visible, date, onClose, onSave, onDelete }: EditDateModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [editedData, setEditedData] = useState({
    notes: '',
    location: '',
    rating: 0,
  });
  
  useEffect(() => {
    if (date) {
      setEditedData({
        notes: date.notes || '',
        location: date.location || '',
        rating: date.rating || 0,
      });
    }
  }, [date]);
  
  const handleSave = () => {
    if (!date) return;
    
    onSave(date.id, {
      notes: editedData.notes,
      location: editedData.location,
      rating: editedData.rating,
    });
    
    onClose();
  };
  
  const handleDelete = () => {
    if (!date || !onDelete) return;
    
    Alert.alert(
      'Delete Date',
      'Are you sure you want to delete this date update?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete(date.id);
            onClose();
          }
        }
      ]
    );
  };
  
  const renderRatingSelector = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Pressable
          key={i}
          onPress={() => setEditedData({ ...editedData, rating: i })}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= editedData.rating ? 'star' : 'star-outline'}
            size={28}
            color={i <= editedData.rating ? '#FFD700' : colors.textSecondary}
          />
        </Pressable>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };
  
  if (!date) return null;
  
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.title, { color: colors.text }]}>Edit Date</Text>
            <Pressable onPress={handleSave} style={styles.headerButton}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
            </Pressable>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Date Info */}
            <View style={[styles.dateInfo, { backgroundColor: colors.card }]}>
              <Text style={[styles.dateInfoText, { color: colors.text }]}>
                Date with {date.personName}
              </Text>
              <Text style={[styles.dateInfoSubtext, { color: colors.textSecondary }]}>
                {date.date}
              </Text>
            </View>
            
            {/* Rating */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Rating</Text>
              {renderRatingSelector()}
            </View>
            
            {/* Location */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editedData.location}
                onChangeText={(text) => setEditedData({ ...editedData, location: text })}
                placeholder="Where did you go?"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            {/* Notes */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editedData.notes}
                onChangeText={(text) => setEditedData({ ...editedData, notes: text })}
                placeholder="How was your date?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            {/* Delete Button */}
            {onDelete && (
              <Pressable
                style={[styles.deleteButton, { borderColor: colors.error }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                  Delete Date
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  cancelButton: {
    fontSize: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  dateInfo: {
    padding: 16,
    marginBottom: 8,
  },
  dateInfoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateInfoSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});