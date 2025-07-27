import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface PollOption {
  text: string;
  votes: number;
}

interface PollVotingProps {
  question: string;
  options: PollOption[];
  totalVotes?: number;
  userVote?: number | null;
  onVote?: (optionIndex: number) => void;
  allowVoting?: boolean;
}

export function PollVoting({
  question,
  options,
  totalVotes: propTotalVotes,
  userVote = null,
  onVote,
  allowVoting = true,
}: PollVotingProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [selectedOption, setSelectedOption] = useState<number | null>(userVote);
  const [animatedValues] = useState(() => 
    options.map(() => new Animated.Value(0))
  );
  
  const totalVotes = propTotalVotes || options.reduce((sum, option) => sum + option.votes, 0);
  const hasVoted = selectedOption !== null;
  
  const handleVote = (index: number) => {
    if (!allowVoting || hasVoted) return;
    
    setSelectedOption(index);
    
    // Animate the selected option
    Animated.timing(animatedValues[index], {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    if (onVote) {
      onVote(index);
    }
  };
  
  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };
  
  const getOptionVotes = (option: PollOption, index: number) => {
    // If user just voted, add their vote to the count
    if (selectedOption === index && userVote === null) {
      return option.votes + 1;
    }
    return option.votes;
  };
  
  const getAdjustedTotalVotes = () => {
    // If user just voted, add their vote to the total
    if (selectedOption !== null && userVote === null) {
      return totalVotes + 1;
    }
    return totalVotes;
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.question, { color: colors.text }]}>{question}</Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const votes = getOptionVotes(option, index);
          const adjustedTotal = getAdjustedTotalVotes();
          const percentage = adjustedTotal > 0 ? Math.round((votes / adjustedTotal) * 100) : 0;
          const isSelected = selectedOption === index;
          const showResults = hasVoted || !allowVoting;
          
          return (
            <Pressable
              key={index}
              style={[
                styles.optionButton,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                }
              ]}
              onPress={() => handleVote(index)}
              disabled={!allowVoting || hasVoted}
            >
              {showResults && (
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: isSelected ? colors.primary + '20' : colors.border + '40',
                      width: `${percentage}%`,
                    }
                  ]}
                />
              )}
              
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.text}
                </Text>
                
                {showResults && (
                  <View style={styles.resultContainer}>
                    <Text style={[styles.percentage, { color: colors.text }]}>
                      {percentage}%
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      
      <Text style={[styles.voteCount, { color: colors.textSecondary }]}>
        {getAdjustedTotalVotes()} {getAdjustedTotalVotes() === 1 ? 'vote' : 'votes'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 48,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentage: {
    fontSize: 15,
    fontWeight: '600',
  },
  voteCount: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});