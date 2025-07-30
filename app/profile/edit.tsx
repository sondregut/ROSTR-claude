import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { pickImageWithCrop } from '@/lib/photoUpload';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/buttons/Button';
import { TagInput } from '@/components/ui/inputs/TagInput';
import { Dropdown } from '@/components/ui/inputs/Dropdown';
import { Avatar } from '@/components/ui/Avatar';
import { useUser } from '@/contexts/UserContext';

interface ProfileData {
  name: string;
  username: string;
  age: number;
  location: string;
  occupation: string;
  bio: string;
  avatarUri: string;
  interests: string[];
  lookingFor: string;
  ageRange: string;
  education: string;
  dealBreakers: string[];
}

const AVAILABLE_INTERESTS = [
  'Travel', 'Photography', 'Cooking', 'Reading', 'Music', 'Movies',
  'Hiking', 'Yoga', 'Running', 'Gym', 'Sports', 'Art',
  'Dancing', 'Gaming', 'Wine', 'Coffee', 'Tea', 'Foodie',
  'Outdoors', 'Beach', 'Mountains', 'Camping', 'Concerts', 'Festivals',
  'Theatre', 'Museums', 'Fashion', 'Shopping', 'Volunteering', 'Pets',
  'Dogs', 'Cats', 'Gardening', 'Board Games', 'Trivia', 'Karaoke',
];

const AVAILABLE_DEAL_BREAKERS = [
  'Smoking', 'Heavy Drinking', 'No Sense of Humor', 'Rude to Service Staff',
  'Bad Hygiene', 'No Ambition', 'Dishonesty', 'Different Life Goals',
  'No Chemistry', 'Poor Communication', 'Jealousy Issues', 'Anger Issues',
  'Different Values', 'No Physical Attraction', 'Incompatible Lifestyles',
  'Financial Irresponsibility', 'Closed-Minded', 'No Emotional Availability',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { userProfile, updateProfile } = useUser();
  
  // Initialize with current user profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    name: userProfile?.name || '',
    username: userProfile?.username || '',
    age: userProfile?.age || 0,
    location: userProfile?.location || '',
    occupation: userProfile?.occupation || '',
    bio: userProfile?.about?.bio || '',
    avatarUri: userProfile?.imageUri || '',
    interests: userProfile?.about?.interests || [],
    lookingFor: userProfile?.preferences?.dating?.lookingFor || '',
    ageRange: userProfile?.preferences?.dating?.ageRange || '',
    education: userProfile?.preferences?.dating?.education || '',
    dealBreakers: userProfile?.preferences?.dealBreakers || [],
  });
  
  const [showCustomInterest, setShowCustomInterest] = useState(false);
  const [customInterestText, setCustomInterestText] = useState('');
  const [showCustomDealBreaker, setShowCustomDealBreaker] = useState(false);
  const [customDealBreakerText, setCustomDealBreakerText] = useState('');
  
  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const handleSave = async () => {
    try {
      // Update the user profile through context
      await updateProfile({
        name: profileData.name,
        username: profileData.username,
        age: profileData.age,
        location: profileData.location,
        occupation: profileData.occupation,
        bio: profileData.bio, // Fix: Pass bio as top-level field
        imageUri: profileData.avatarUri,
        about: {
          bio: profileData.bio,
          interests: profileData.interests,
        },
        preferences: {
          dating: {
            lookingFor: profileData.lookingFor,
            ageRange: profileData.ageRange,
            education: profileData.education,
          },
          dealBreakers: profileData.dealBreakers,
        },
      });
      
      Alert.alert('Success', 'Your profile has been updated!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };
  
  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };
  
  const pickImage = async () => {
    try {
      const result = await pickImageWithCrop('library', {
        aspect: [1, 1], // Square aspect ratio for profile photos
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (result.success && result.uri) {
        setProfileData({ ...profileData, avatarUri: result.uri });
      } else if (result.error && result.error !== 'Selection cancelled') {
        Alert.alert('Error', `Failed to pick image: ${result.error}`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const addInterest = (interest: string) => {
    if (!profileData.interests.includes(interest)) {
      setProfileData({
        ...profileData,
        interests: [...profileData.interests, interest]
      });
    }
  };
  
  const removeInterest = (interest: string) => {
    setProfileData({
      ...profileData,
      interests: profileData.interests.filter(i => i !== interest)
    });
  };
  
  const addDealBreaker = (dealBreaker: string) => {
    if (!profileData.dealBreakers.includes(dealBreaker)) {
      setProfileData({
        ...profileData,
        dealBreakers: [...profileData.dealBreakers, dealBreaker]
      });
    }
  };
  
  const removeDealBreaker = (dealBreaker: string) => {
    setProfileData({
      ...profileData,
      dealBreakers: profileData.dealBreakers.filter(d => d !== dealBreaker)
    });
  };
  
  const availableInterests = AVAILABLE_INTERESTS.filter(
    interest => !profileData.interests.includes(interest)
  );
  
  const availableDealBreakers = AVAILABLE_DEAL_BREAKERS.filter(
    dealBreaker => !profileData.dealBreakers.includes(dealBreaker)
  );
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Pressable onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerSpacer} />
          <Pressable onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
          </Pressable>
        </View>
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo & Basic Info */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Photo & Basic Info</Text>
            
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Pressable onPress={pickImage} style={styles.avatarContainer}>
                <Avatar 
                  uri={profileData.avatarUri} 
                  name={profileData.name}
                  size={100}
                  backgroundColor={colors.primary}
                  textColor="white"
                />
                <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              </Pressable>
            </View>
            
            {/* Basic Info Inputs */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={profileData.name}
                onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Username</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={profileData.username}
                onChangeText={(text) => setProfileData({ ...profileData, username: text })}
                placeholder="Username"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={profileData.age.toString()}
                  onChangeText={(text) => setProfileData({ ...profileData, age: parseInt(text) || 0 })}
                  keyboardType="number-pad"
                  placeholder="Age"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Location</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={profileData.location}
                  onChangeText={(text) => setProfileData({ ...profileData, location: text })}
                  placeholder="City, State"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Occupation</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={profileData.occupation}
                onChangeText={(text) => setProfileData({ ...profileData, occupation: text })}
                placeholder="What do you do?"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
          
          {/* About Me */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
            
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={profileData.bio}
              onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {profileData.bio.length}/500 characters
            </Text>
          </View>
          
          {/* Interests */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            
            {/* Selected Interests */}
            <View style={styles.tagContainer}>
              {profileData.interests.map((interest) => (
                <Pressable
                  key={interest}
                  style={[styles.selectedTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                  onPress={() => removeInterest(interest)}
                >
                  <Text style={[styles.selectedTagText, { color: colors.primary }]}>{interest}</Text>
                  <Ionicons name="close" size={16} color={colors.primary} />
                </Pressable>
              ))}
            </View>
            
            {/* Available Interests */}
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>Add interests:</Text>
            <View style={styles.tagContainer}>
              {availableInterests.map((interest) => (
                <Pressable
                  key={interest}
                  style={[styles.availableTag, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => addInterest(interest)}
                >
                  <Ionicons name="add" size={16} color={colors.text} />
                  <Text style={[styles.availableTagText, { color: colors.text }]}>{interest}</Text>
                </Pressable>
              ))}
              
              <Pressable
                style={[styles.availableTag, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowCustomInterest(true)}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.availableTagText, { color: colors.primary }]}>Add Custom</Text>
              </Pressable>
            </View>
            
            {showCustomInterest && (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={[styles.customInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={customInterestText}
                  onChangeText={setCustomInterestText}
                  placeholder="Enter custom interest"
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={() => {
                    if (customInterestText.trim()) {
                      addInterest(customInterestText.trim());
                      setCustomInterestText('');
                      setShowCustomInterest(false);
                    }
                  }}
                />
              </View>
            )}
          </View>
          
          {/* Dating Preferences */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dating Preferences</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Looking For</Text>
              <Dropdown
                value={profileData.lookingFor}
                onValueChange={(value) => setProfileData({ ...profileData, lookingFor: value })}
                options={[
                  { label: 'Casual Dating', value: 'Casual Dating' },
                  { label: 'Serious Relationship', value: 'Serious Relationship' },
                  { label: 'Marriage', value: 'Marriage' },
                  { label: 'Not Sure Yet', value: 'Not Sure Yet' },
                ]}
                placeholder="Select what you're looking for"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Age Range</Text>
              <Dropdown
                value={profileData.ageRange}
                onValueChange={(value) => setProfileData({ ...profileData, ageRange: value })}
                options={[
                  { label: '18-25', value: '18-25' },
                  { label: '22-30', value: '22-30' },
                  { label: '25-35', value: '25-35' },
                  { label: '30-40', value: '30-40' },
                  { label: '35-45', value: '35-45' },
                  { label: '40+', value: '40+' },
                ]}
                placeholder="Select age range"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Education</Text>
              <Dropdown
                value={profileData.education}
                onValueChange={(value) => setProfileData({ ...profileData, education: value })}
                options={[
                  { label: 'High School', value: 'High School' },
                  { label: 'Some College', value: 'Some College' },
                  { label: 'College+', value: 'College+' },
                  { label: 'Graduate Degree', value: 'Graduate Degree' },
                  { label: 'No Preference', value: 'No Preference' },
                ]}
                placeholder="Select education preference"
              />
            </View>
          </View>
          
          {/* Deal Breakers */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Deal Breakers</Text>
            
            {/* Selected Deal Breakers */}
            <View style={styles.tagContainer}>
              {profileData.dealBreakers.map((dealBreaker) => (
                <Pressable
                  key={dealBreaker}
                  style={[styles.selectedTag, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
                  onPress={() => removeDealBreaker(dealBreaker)}
                >
                  <Text style={[styles.selectedTagText, { color: colors.error }]}>{dealBreaker}</Text>
                  <Ionicons name="close" size={16} color={colors.error} />
                </Pressable>
              ))}
            </View>
            
            {/* Available Deal Breakers */}
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>Add deal breakers:</Text>
            <View style={styles.tagContainer}>
              {availableDealBreakers.map((dealBreaker) => (
                <Pressable
                  key={dealBreaker}
                  style={[styles.availableTag, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => addDealBreaker(dealBreaker)}
                >
                  <Ionicons name="add" size={16} color={colors.text} />
                  <Text style={[styles.availableTagText, { color: colors.text }]}>{dealBreaker}</Text>
                </Pressable>
              ))}
              
              <Pressable
                style={[styles.availableTag, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowCustomDealBreaker(true)}
              >
                <Ionicons name="add" size={16} color={colors.error} />
                <Text style={[styles.availableTagText, { color: colors.error }]}>Add Custom</Text>
              </Pressable>
            </View>
            
            {showCustomDealBreaker && (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={[styles.customInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={customDealBreakerText}
                  onChangeText={setCustomDealBreakerText}
                  placeholder="Enter custom deal breaker"
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={() => {
                    if (customDealBreakerText.trim()) {
                      addDealBreaker(customDealBreakerText.trim());
                      setCustomDealBreakerText('');
                      setShowCustomDealBreaker(false);
                    }
                  }}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  headerSpacer: {
    flex: 1,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  selectedTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  availableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  availableTagText: {
    fontSize: 14,
  },
  customInputContainer: {
    marginTop: 12,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});