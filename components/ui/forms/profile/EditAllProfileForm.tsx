import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AboutMeEditForm } from './AboutMeEditForm';
import { BasicInfoEditForm } from './BasicInfoEditForm';
import { InterestsEditForm } from './InterestsEditForm';
import { DatingPreferencesEditForm } from './DatingPreferencesEditForm';
import { DealBreakersEditForm } from './DealBreakersEditForm';

interface UserProfile {
  about: {
    bio: string;
    interests: string[];
  };
  location: string;
  occupation: string;
  age: number;
  instagramUsername?: string;
  preferences: {
    dating: {
      lookingFor: string;
      ageRange: string;
      education: string;
    };
    dealBreakers: string[];
  };
}

interface EditAllProfileFormProps {
  userProfile: UserProfile;
  onChange: (updates: Partial<UserProfile>) => void;
}

type TabType = 'about' | 'basic' | 'interests' | 'dating' | 'dealBreakers';

const TABS = [
  { id: 'about' as TabType, label: 'About', icon: '📝' },
  { id: 'basic' as TabType, label: 'Basic', icon: '👤' },
  { id: 'interests' as TabType, label: 'Interests', icon: '🎯' },
  { id: 'dating' as TabType, label: 'Dating', icon: '💕' },
  { id: 'dealBreakers' as TabType, label: 'Deal Breakers', icon: '🚫' },
];

export function EditAllProfileForm({ userProfile, onChange }: EditAllProfileFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<TabType>('about');

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.id ? colors.primary : colors.card,
                borderColor: activeTab === tab.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.id ? 'white' : colors.text,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'about':
        return (
          <AboutMeEditForm
            initialBio={userProfile.about.bio}
            onChange={(bio) => {
              onChange({
                about: { ...userProfile.about, bio },
              });
            }}
          />
        );

      case 'basic':
        return (
          <BasicInfoEditForm
            initialInfo={{
              location: userProfile.location,
              occupation: userProfile.occupation,
              age: userProfile.age,
              instagramUsername: userProfile.instagramUsername,
            }}
            onChange={(info) => {
              onChange(info);
            }}
          />
        );

      case 'interests':
        return (
          <InterestsEditForm
            initialInterests={userProfile.about.interests}
            onChange={(interests) => {
              onChange({
                about: { ...userProfile.about, interests },
              });
            }}
          />
        );

      case 'dating':
        return (
          <DatingPreferencesEditForm
            initialPreferences={userProfile.preferences.dating}
            onChange={(dating) => {
              onChange({
                preferences: { ...userProfile.preferences, dating },
              });
            }}
          />
        );

      case 'dealBreakers':
        return (
          <DealBreakersEditForm
            initialDealBreakers={userProfile.preferences.dealBreakers}
            onChange={(dealBreakers) => {
              onChange({
                preferences: { ...userProfile.preferences, dealBreakers },
              });
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderTabBar()}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {renderActiveTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabScrollContent: {
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});