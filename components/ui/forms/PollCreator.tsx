import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Poll {
  question: string;
  options: string[];
}

interface PollCreatorProps {
  poll?: Poll;
  onPollChange: (poll: Poll | null) => void;
}

const PREDEFINED_POLLS = [
  {
    question: 'Will there be another date?',
    options: ['Definitely', 'Maybe', 'Unlikely', 'No way'],
  },
  {
    question: 'Is this a keeper?',
    options: ['Yes!', 'Too early to tell', 'Just having fun', 'Nope'],
  },
  {
    question: 'Red flag alert?',
    options: ['No red flags', 'Minor concerns', 'Major red flags', 'Run!'],
  },
  {
    question: 'Vibe check',
    options: ['Amazing chemistry', 'Good vibes', 'Neutral', 'No spark'],
  },
  {
    question: 'Perfect match?',
    options: ['Soulmate material', 'Great potential', 'Not sure yet', 'Definitely not'],
  },
];

export function PollCreator({ poll, onPollChange }: PollCreatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isExpanded, setIsExpanded] = useState(!!poll);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customQuestion, setCustomQuestion] = useState(poll?.question || '');
  const [customOptions, setCustomOptions] = useState<string[]>(
    poll?.options || ['', '', '', '']
  );
  
  const handleTemplateSelect = (index: number) => {
    const template = PREDEFINED_POLLS[index];
    setSelectedTemplate(index);
    setCustomQuestion(template.question);
    setCustomOptions(template.options);
    onPollChange(template);
  };
  
  const handleCustomQuestionChange = (text: string) => {
    setCustomQuestion(text);
    updatePoll(text, customOptions);
  };
  
  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...customOptions];
    newOptions[index] = text;
    setCustomOptions(newOptions);
    updatePoll(customQuestion, newOptions);
  };
  
  const updatePoll = (question: string, options: string[]) => {
    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (question.trim() && validOptions.length >= 2) {
      onPollChange({ question, options: validOptions });
    } else {
      onPollChange(null);
    }
  };
  
  const removePoll = () => {
    setIsExpanded(false);
    setSelectedTemplate(null);
    setCustomQuestion('');
    setCustomOptions(['', '', '', '']);
    onPollChange(null);
  };
  
  const addOption = () => {
    if (customOptions.length < 6) {
      setCustomOptions([...customOptions, '']);
    }
  };
  
  const removeOption = (index: number) => {
    if (customOptions.length > 2) {
      const newOptions = customOptions.filter((_, i) => i !== index);
      setCustomOptions(newOptions);
      updatePoll(customQuestion, newOptions);
    }
  };
  
  if (!isExpanded) {
    return (
      <Pressable
        style={[styles.addPollButton, { borderColor: colors.border }]}
        onPress={() => setIsExpanded(true)}
      >
        <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
        <Text style={[styles.addPollText, { color: colors.primary }]}>
          Add a Poll
        </Text>
      </Pressable>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Add a Poll</Text>
        <Pressable onPress={removePoll} style={styles.removeButton}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
        {PREDEFINED_POLLS.map((template, index) => (
          <Pressable
            key={index}
            style={[
              styles.templateChip,
              {
                backgroundColor: selectedTemplate === index ? colors.primary : colors.background,
                borderColor: selectedTemplate === index ? colors.primary : colors.border,
              }
            ]}
            onPress={() => handleTemplateSelect(index)}
          >
            <Text
              style={[
                styles.templateText,
                { color: selectedTemplate === index ? 'white' : colors.text }
              ]}
            >
              {template.question}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      
      <View style={styles.customSection}>
        <Text style={[styles.label, { color: colors.text }]}>Question</Text>
        <TextInput
          style={[
            styles.questionInput,
            {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            }
          ]}
          placeholder="Ask your friends something..."
          placeholderTextColor={colors.textSecondary}
          value={customQuestion}
          onChangeText={handleCustomQuestionChange}
        />
        
        <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
          Options (min 2, max 6)
        </Text>
        {customOptions.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <TextInput
              style={[
                styles.optionInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }
              ]}
              placeholder={`Option ${index + 1}`}
              placeholderTextColor={colors.textSecondary}
              value={option}
              onChangeText={(text) => handleOptionChange(index, text)}
            />
            {customOptions.length > 2 && (
              <Pressable
                style={styles.removeOptionButton}
                onPress={() => removeOption(index)}
              >
                <Ionicons name="remove-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        ))}
        
        {customOptions.length < 6 && (
          <Pressable
            style={[styles.addOptionButton, { borderColor: colors.border }]}
            onPress={addOption}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[styles.addOptionText, { color: colors.primary }]}>
              Add Option
            </Text>
          </Pressable>
        )}
      </View>
      
      {customQuestion && customOptions.filter(o => o.trim()).length >= 2 && (
        <View style={[styles.preview, { backgroundColor: colors.background }]}>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview</Text>
          <Text style={[styles.previewQuestion, { color: colors.text }]}>{customQuestion}</Text>
          <View style={styles.previewOptions}>
            {customOptions.filter(o => o.trim()).map((option, index) => (
              <View
                key={index}
                style={[styles.previewOption, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.previewOptionText, { color: colors.text }]}>
                  {option}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addPollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 8,
  },
  addPollText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  templateScroll: {
    marginBottom: 16,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  templateChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  templateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customSection: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  questionInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  removeOptionButton: {
    marginLeft: 8,
    padding: 4,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  preview: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  previewQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewOptions: {
    gap: 8,
  },
  previewOption: {
    padding: 10,
    borderRadius: 8,
  },
  previewOptionText: {
    fontSize: 14,
  },
});