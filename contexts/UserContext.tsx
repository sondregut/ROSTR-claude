import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id?: string;
  name: string;
  username: string;
  bio: string;
  location: string;
  occupation: string;
  age: number;
  imageUri: string;
  instagramUsername?: string;
  stats: {
    totalDates: number;
    activeConnections: number;
    avgRating: number;
    circles: number;
  };
  about: {
    bio: string;
    interests: string[];
  };
  preferences: {
    dating: {
      lookingFor: string;
      ageRange: string;
      distance: string;
      education: string;
    };
    lifestyle: {
      drinking: string;
      smoking: string;
      exercise: string;
      diet: string;
    };
    dealBreakers: string[];
  };
}

interface UserContextType {
  userProfile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_PROFILE_KEY = '@user_profile';

// Default profile data (previously MOCK_USER)
const DEFAULT_PROFILE: UserProfile = {
  id: 'mock-user-id',
  name: 'Jamie Smith',
  username: '@jamiesmith',
  bio: 'Coffee enthusiast, hiking lover, and always up for trying new restaurants. Looking for someone who can make me laugh and shares my love for adventure.',
  location: 'New York, NY',
  occupation: 'Marketing Manager',
  age: 28,
  imageUri: 'https://randomuser.me/api/portraits/women/68.jpg',
  instagramUsername: 'alex_codes',
  stats: {
    totalDates: 12,
    activeConnections: 4,
    avgRating: 3.8,
    circles: 5,
  },
  about: {
    bio: 'Coffee enthusiast, hiking lover, and always up for trying new restaurants. Looking for someone who can make me laugh and shares my love for adventure.',
    interests: ['Coffee', 'Hiking', 'Photography', 'Cooking', 'Travel', 'Art', 'Music', 'Fitness'],
  },
  preferences: {
    dating: {
      lookingFor: 'Serious Relationship',
      ageRange: '25-35',
      distance: 'Within 25 miles',
      education: 'College+',
    },
    lifestyle: {
      drinking: 'Socially',
      smoking: 'Never',
      exercise: 'Regularly',
      diet: 'No restrictions',
    },
    dealBreakers: ['Smoking', 'No sense of humor', 'Rude to service staff', 'Always late', 'Poor hygiene']
  }
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const savedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      } else {
        // First time user, set default profile
        setUserProfile(DEFAULT_PROFILE);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load profile');
      // Fallback to default profile
      setUserProfile(DEFAULT_PROFILE);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!userProfile) return;
      
      const updatedProfile = {
        ...userProfile,
        ...updates,
        // Deep merge for nested objects
        about: updates.about ? { ...userProfile.about, ...updates.about } : userProfile.about,
        preferences: updates.preferences ? {
          ...userProfile.preferences,
          dating: updates.preferences.dating ? { ...userProfile.preferences.dating, ...updates.preferences.dating } : userProfile.preferences.dating,
          lifestyle: updates.preferences.lifestyle ? { ...userProfile.preferences.lifestyle, ...updates.preferences.lifestyle } : userProfile.preferences.lifestyle,
          dealBreakers: updates.preferences.dealBreakers || userProfile.preferences.dealBreakers,
        } : userProfile.preferences,
        stats: updates.stats ? { ...userProfile.stats, ...updates.stats } : userProfile.stats,
      };

      setUserProfile(updatedProfile);
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));

      // TODO: Sync with Supabase when user is authenticated
      // For now, we're using local storage for the mock user
      
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to save profile');
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{ userProfile, updateProfile, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}