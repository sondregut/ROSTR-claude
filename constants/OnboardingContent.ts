export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon?: string;
  image?: any;
  backgroundColor?: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Your Dating Life,\nOrganized',
    subtitle: 'Welcome to ROSTR',
    description: 'Track everyone you\'re dating—from first impressions to date history—all in one place. Think of it as your personal dating CRM.',
    icon: 'calendar-outline',
    backgroundColor: '#FFF8F3',
  },
  {
    id: 'social',
    title: 'Never Make a Dating Decision Alone Again',
    subtitle: 'Get Advice From Your Crew',
    description: 'Share updates with your trusted friends, create polls, and get real-time feedback when you need it most.',
    icon: 'people-outline',
    backgroundColor: '#FFF0E5',
  },
  {
    id: 'privacy',
    title: 'You Control Everything',
    subtitle: 'Your Privacy Matters',
    description: 'Use Friend Circles to choose exactly who sees your updates. Your roster, your rules.',
    icon: 'lock-closed-outline',
    backgroundColor: '#FFE8D6',
  },
  {
    id: 'start',
    title: 'Ready to Build Your Roster?',
    subtitle: 'Let\'s Get Started',
    description: 'Join thousands who are taking control of their dating life with the support of their friends.',
    icon: 'heart-outline',
    backgroundColor: '#FFE0CC',
  }
];

// Onboarding progress keys for AsyncStorage
export const ONBOARDING_KEYS = {
  HAS_SEEN_WELCOME: 'has_seen_welcome',
  HAS_CREATED_ACCOUNT: 'has_created_account',
  HAS_CREATED_CIRCLE: 'has_created_circle',
  HAS_INVITED_FRIENDS: 'has_invited_friends',
  HAS_ADDED_ROSTER: 'has_added_roster',
  HAS_SEEN_COACH_MARKS: 'has_seen_coach_marks',
  ONBOARDING_COMPLETE: 'onboarding_complete',
};

// Coach mark content
export const COACH_MARKS = {
  feed: {
    title: 'Your Feed',
    description: 'All updates from you and your friends will appear here.',
  },
  roster: {
    title: 'Your Roster',
    description: 'Tap here to see and manage everyone you\'re dating.',
  },
  update: {
    title: 'Share Updates',
    description: 'Ready to post about a date? Tap here to share with your circles.',
  },
  circles: {
    title: 'Friend Circles',
    description: 'Manage your circles and privacy settings here.',
  },
  profile: {
    title: 'Your Profile',
    description: 'View your dating stats and edit your profile here.',
  },
};

// Permission request messages
export const PERMISSION_MESSAGES = {
  contacts: {
    title: 'Find Your Friends',
    message: 'To easily find your friends, ROSTR would like to access your contacts. We never store or share your contacts.',
  },
  notifications: {
    title: 'Stay Updated',
    message: 'We\'ll let you know when friends comment on your updates or vote in your polls.',
  },
  photos: {
    title: 'Add Photos',
    message: 'Allow ROSTR to access your photos to add profile pictures for people you\'re dating.',
  },
};

// Empty state messages
export const EMPTY_STATES = {
  feed: {
    title: 'Your feed is ready!',
    description: 'It will light up with activity as soon as your friends join your circle and start sharing.',
    action: 'Invite More Friends',
  },
  roster: {
    title: 'Your roster is empty',
    description: 'Add someone you\'re dating, talking to, or interested in.',
    action: 'Add Someone',
  },
  circles: {
    title: 'No circles yet',
    description: 'Create your first circle to start sharing with friends.',
    action: 'Create Circle',
  },
};