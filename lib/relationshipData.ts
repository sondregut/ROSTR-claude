/**
 * Relationship data structure and utilities for dating history tracking
 */

export interface RelationshipData {
  poster: {
    name: string;
    username: string;
    avatar: string;
  };
  person: {
    name: string;
    avatar: string;
  };
  status: 'Active' | 'New' | 'Fading' | 'Ended';
  stats: {
    totalDates: number;
    averageRating: number;
    firstDate: string;
    lastDate: string;
    trend: 'up' | 'down' | 'stable';
    compatibility: number;
    daysSinceFirst?: number;
  };
  dateHistory: Array<{
    id: string;
    date: string;
    rating: number;
    location: string;
    notes: string;
    tags: string[];
    poll?: {
      question: string;
      options: Array<{
        text: string;
        votes: number;
      }>;
    };
    userPollVote?: number | null;
    comments?: Array<{
      name: string;
      content: string;
    }>;
    likeCount?: number;
    commentCount?: number;
    isLiked?: boolean;
  }>;
}

// Mock relationship data
const datingRelationships: Record<string, RelationshipData> = {
  'emmaw-alex': {
    poster: {
      name: 'Emma Wilson',
      username: 'emmaw',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    person: {
      name: 'Alex',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    status: 'Active',
    stats: {
      totalDates: 6,
      averageRating: 4.3,
      firstDate: '3 weeks ago',
      lastDate: '2h ago',
      trend: 'up',
      compatibility: 9.0,
      daysSinceFirst: 21,
    },
    dateHistory: [
      {
        id: 'd6',
        date: '2h ago',
        rating: 4.5,
        location: 'Rooftop Restaurant',
        notes: 'Amazing dinner at that rooftop place! Alex surprised me with reservations at my favorite spot. The view was incredible and we talked for hours about our travel plans. Definitely feeling a strong connection.',
        tags: ['Sixth Date', 'Chemistry', 'Romantic'],
        poll: {
          question: 'Will there be a seventh date?',
          options: [
            { text: 'Absolutely!', votes: 8 },
            { text: 'Probably', votes: 2 },
            { text: 'Maybe', votes: 0 },
          ]
        },
        userPollVote: null,
        comments: [
          { name: 'Sarah', content: 'So happy for you!' },
          { name: 'Mike', content: 'Sounds like a great match' },
        ],
        likeCount: 12,
        commentCount: 2,
        isLiked: true,
      },
      {
        id: 'd5',
        date: '1 week ago',
        rating: 4.0,
        location: 'Metropolitan Museum',
        notes: 'Went to the art museum together. Alex knows so much about art history and made it really interesting. We spent hours exploring and then grabbed coffee after.',
        tags: ['Fifth Date', 'Cultural', 'Great Conversation'],
        likeCount: 8,
        commentCount: 1,
        isLiked: false,
        comments: [
          { name: 'Jordan', content: 'Museums are always a good choice!' }
        ],
      },
      {
        id: 'd4',
        date: '2 weeks ago',
        rating: 3.8,
        location: 'Central Park',
        notes: 'Coffee and a long walk through the park. Weather was perfect. We talked about our families and future goals.',
        tags: ['Fourth Date', 'Casual', 'Deep Conversation'],
        likeCount: 5,
        commentCount: 0,
        isLiked: false,
      },
      {
        id: 'd3',
        date: '3 weeks ago',
        rating: 4.2,
        location: 'Cooking Class',
        notes: 'Took a cooking class together - so much fun! We made pasta from scratch and Alex was surprisingly good at it.',
        tags: ['Third Date', 'Activity Date', 'Fun'],
        likeCount: 9,
        commentCount: 2,
        isLiked: true,
        comments: [
          { name: 'Alex', content: 'Cooking together is so fun!' },
          { name: 'Taylor', content: 'Did you keep the recipe?' }
        ],
      },
    ]
  },
  'emmaw-jordan': {
    poster: {
      name: 'Emma Wilson',
      username: 'emmaw',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    person: {
      name: 'Jordan',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    status: 'New',
    stats: {
      totalDates: 2,
      averageRating: 3.8,
      firstDate: '2 weeks ago',
      lastDate: 'Yesterday',
      trend: 'stable',
      compatibility: 7.0,
      daysSinceFirst: 14,
    },
    dateHistory: [
      {
        id: 'd2',
        date: 'Yesterday',
        rating: 4.0,
        location: 'Art Gallery',
        notes: 'Visited a local art gallery in Chelsea. Jordan knew a lot about the artists and their techniques. Very impressive!',
        tags: ['Second Date', 'Cultural', 'Interesting'],
        likeCount: 3,
        commentCount: 0,
        isLiked: false,
      },
      {
        id: 'd1',
        date: '2 weeks ago',
        rating: 3.5,
        location: 'Coffee Shop',
        notes: 'First coffee date. A bit nervous at first but opened up after a while. Talked mostly about work and hobbies.',
        tags: ['First Date', 'Coffee Date', 'Getting to Know'],
        likeCount: 5,
        commentCount: 1,
        isLiked: false,
        comments: [
          { name: 'Sarah', content: 'First dates are always nerve-wracking!' }
        ],
      },
    ]
  }
};

/**
 * Format person name for URL (lowercase, replace spaces with hyphens)
 */
export const formatPersonForUrl = (personName: string): string => {
  return personName.toLowerCase().replace(/\s+/g, '-');
};

/**
 * Generate relationship key from username and person name
 */
export const getRelationshipKey = (username: string, personName: string): string => {
  return `${username}-${formatPersonForUrl(personName)}`;
};

/**
 * Get relationship data by key
 */
export const getRelationshipData = (relationshipKey: string): RelationshipData | null => {
  return datingRelationships[relationshipKey] || null;
};

/**
 * Get relationship data by username and person name
 */
export const getRelationshipByNames = (username: string, personName: string): RelationshipData | null => {
  const key = getRelationshipKey(username, personName);
  return getRelationshipData(key);
};

/**
 * Check if a relationship exists
 */
export const hasRelationshipData = (username: string, personName: string): boolean => {
  const key = getRelationshipKey(username, personName);
  return key in datingRelationships;
};

/**
 * Generate dating history URL
 */
export const generateHistoryUrl = (username: string, personName: string): string => {
  return `/profile/${username}/dates/${formatPersonForUrl(personName)}`;
};

/**
 * Get all available relationships for a user
 */
export const getUserRelationships = (username: string): RelationshipData[] => {
  return Object.entries(datingRelationships)
    .filter(([key]) => key.startsWith(`${username}-`))
    .map(([, relationship]) => relationship);
};