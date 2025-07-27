import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateEntryFormData } from '@/components/ui/forms/DateEntryForm';

// Extended interface for date entries in the feed
export interface DateEntry {
  id: string;
  personName: string;
  date: string; // ISO string or relative time like "2h ago"
  location: string;
  rating: number;
  notes: string;
  tags: string[];
  circles: string[];
  isPrivate: boolean;
  imageUri?: string;
  poll?: {
    question: string;
    options: Array<{
      text: string;
      votes: number;
    }>;
  };
  userPollVote?: number | null;
  comments: Array<{
    name: string;
    content: string;
  }>;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  authorName: string; // The user who created this entry
  authorAvatar?: string;
  createdAt: string; // ISO timestamp for sorting
  updatedAt: string;
}

interface DateContextType {
  dates: DateEntry[];
  addDate: (formData: DateEntryFormData) => Promise<void>;
  updateDate: (id: string, updates: Partial<DateEntry>) => Promise<void>;
  deleteDate: (id: string) => Promise<void>;
  likeDate: (id: string) => void;
  addComment: (id: string, comment: { name: string; content: string }) => void;
  voteOnPoll: (id: string, optionIndex: number) => void;
  refreshDates: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

const DATES_STORAGE_KEY = '@date_entries';

// Initial mock data - this will be replaced with Supabase data later
const INITIAL_MOCK_DATES: DateEntry[] = [
  {
    id: '1',
    personName: 'Alex',
    date: '2h ago',
    location: 'Italian Restaurant',
    rating: 4.5,
    notes: 'Dinner date at that new Italian place was amazing! Great conversation, lots of laughing. Definitely seeing him again.',
    tags: ['Second Date', 'Chemistry'],
    circles: ['inner-circle', 'friends'],
    isPrivate: false,
    poll: {
      question: 'Will there be a third date?',
      options: [
        { text: 'Yes', votes: 3 },
        { text: 'Maybe', votes: 1 },
        { text: 'No', votes: 0 }
      ]
    },
    userPollVote: null,
    comments: [
      { name: 'Sarah', content: 'He sounds perfect! Can\'t wait to hear about the next date!' }
    ],
    likeCount: 0,
    commentCount: 1,
    isLiked: false,
    authorName: 'You',
    authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    personName: 'Jordan',
    date: 'Yesterday',
    location: 'Coffee Shop',
    rating: 3.0,
    notes: 'Coffee meet-up was okay. Conversation was a bit forced but he seemed nice. Not sure if there\'s a spark.',
    tags: [],
    circles: ['friends'],
    isPrivate: false,
    poll: {
      question: 'Should I see him again?',
      options: [
        { text: 'Give it another shot', votes: 5 },
        { text: 'Move on', votes: 2 }
      ]
    },
    userPollVote: null,
    comments: [],
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    authorName: 'You',
    authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDates();
  }, []);

  const loadDates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const savedDates = await AsyncStorage.getItem(DATES_STORAGE_KEY);
      if (savedDates) {
        const parsedDates = JSON.parse(savedDates);
        // Sort by creation date, most recent first
        const sortedDates = parsedDates.sort((a: DateEntry, b: DateEntry) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setDates(sortedDates);
      } else {
        // First time, use initial mock data
        setDates(INITIAL_MOCK_DATES);
        await AsyncStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATES));
      }
    } catch (err) {
      console.error('Error loading dates:', err);
      setError('Failed to load dates');
      // Fallback to mock data
      setDates(INITIAL_MOCK_DATES);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDates = async (newDates: DateEntry[]) => {
    try {
      await AsyncStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(newDates));
    } catch (err) {
      console.error('Error saving dates:', err);
      setError('Failed to save dates');
    }
  };

  const addDate = async (formData: DateEntryFormData) => {
    try {
      const newDate: DateEntry = {
        id: `date_${Date.now()}`,
        personName: formData.personName,
        date: 'Just now',
        location: formData.location,
        rating: formData.rating,
        notes: formData.notes,
        tags: formData.tags,
        circles: formData.circles,
        isPrivate: formData.isPrivate,
        imageUri: formData.imageUri,
        poll: formData.poll,
        userPollVote: null,
        comments: [],
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        authorName: 'You',
        authorAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', // This would come from user profile
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedDates = [newDate, ...dates]; // Add to beginning for most recent first
      setDates(updatedDates);
      await saveDates(updatedDates);
    } catch (err) {
      console.error('Error adding date:', err);
      setError('Failed to add date');
      throw err;
    }
  };

  const updateDate = async (id: string, updates: Partial<DateEntry>) => {
    try {
      const updatedDates = dates.map(date =>
        date.id === id
          ? { ...date, ...updates, updatedAt: new Date().toISOString() }
          : date
      );
      setDates(updatedDates);
      await saveDates(updatedDates);
    } catch (err) {
      console.error('Error updating date:', err);
      setError('Failed to update date');
      throw err;
    }
  };

  const deleteDate = async (id: string) => {
    try {
      const updatedDates = dates.filter(date => date.id !== id);
      setDates(updatedDates);
      await saveDates(updatedDates);
    } catch (err) {
      console.error('Error deleting date:', err);
      setError('Failed to delete date');
      throw err;
    }
  };

  const likeDate = (id: string) => {
    const updatedDates = dates.map(date =>
      date.id === id
        ? {
            ...date,
            isLiked: !date.isLiked,
            likeCount: date.isLiked ? date.likeCount - 1 : date.likeCount + 1,
          }
        : date
    );
    setDates(updatedDates);
    saveDates(updatedDates); // Save asynchronously without awaiting
  };

  const addComment = (id: string, comment: { name: string; content: string }) => {
    const updatedDates = dates.map(date =>
      date.id === id
        ? {
            ...date,
            comments: [...date.comments, comment],
            commentCount: date.commentCount + 1,
          }
        : date
    );
    setDates(updatedDates);
    saveDates(updatedDates); // Save asynchronously without awaiting
  };

  const voteOnPoll = (id: string, optionIndex: number) => {
    const updatedDates = dates.map(date => {
      if (date.id === id && date.poll) {
        const updatedOptions = date.poll.options.map((option, index) =>
          index === optionIndex
            ? { ...option, votes: option.votes + 1 }
            : option
        );

        return {
          ...date,
          poll: {
            ...date.poll,
            options: updatedOptions,
          },
          userPollVote: optionIndex,
        };
      }
      return date;
    });
    setDates(updatedDates);
    saveDates(updatedDates); // Save asynchronously without awaiting
  };

  const refreshDates = async () => {
    // For now, just reload from storage
    // Later this will fetch from Supabase
    await loadDates();
  };

  return (
    <DateContext.Provider
      value={{
        dates,
        addDate,
        updateDate,
        deleteDate,
        likeDate,
        addComment,
        voteOnPoll,
        refreshDates,
        isLoading,
        error,
      }}
    >
      {children}
    </DateContext.Provider>
  );
}

export function useDates() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDates must be used within a DateProvider');
  }
  return context;
}