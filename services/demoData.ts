/**
 * Demo data service for App Store review
 * Provides sample data to showcase app functionality
 */

export const DEMO_CREDENTIALS = {
  email: 'demo@rostrdating.com',
  password: 'DemoUser2024!',
  name: 'Alex Demo',
  username: 'alexdemo'
};

export const DEMO_ROSTER = [
  {
    id: 'demo-roster-1',
    person_name: 'Emma Wilson',
    person_age: 28,
    person_occupation: 'Product Designer',
    person_location: 'San Francisco, CA',
    person_bio: 'Creative designer who loves hiking and coffee',
    person_interests: ['Design', 'Hiking', 'Photography', 'Coffee'],
    person_instagram: '@emmawilson',
    person_image_url: 'https://i.pravatar.cc/400?img=1',
    date_count: 3,
    last_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    avg_rating: 4.5,
    status: 'active',
    tags: ['Creative', 'Adventurous', 'Coffee Lover'],
    notes: 'Met at a design conference. Great conversation about UX trends.'
  },
  {
    id: 'demo-roster-2',
    person_name: 'Michael Chen',
    person_age: 31,
    person_occupation: 'Software Engineer',
    person_location: 'Palo Alto, CA',
    person_bio: 'Tech enthusiast, foodie, and weekend hiker',
    person_interests: ['Technology', 'Food', 'Travel', 'Gaming'],
    person_instagram: '@mikechen',
    person_image_url: 'https://i.pravatar.cc/400?img=3',
    date_count: 2,
    last_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    avg_rating: 4.0,
    status: 'active',
    tags: ['Techie', 'Foodie', 'Gamer'],
    notes: 'Connected through a mutual friend. Shares love for Japanese cuisine.'
  },
  {
    id: 'demo-roster-3',
    person_name: 'Sarah Johnson',
    person_age: 26,
    person_occupation: 'Marketing Manager',
    person_location: 'San Jose, CA',
    person_bio: 'Yoga instructor on weekends, marketing pro on weekdays',
    person_interests: ['Yoga', 'Marketing', 'Wine', 'Travel'],
    person_instagram: '@sarahj_yoga',
    person_image_url: 'https://i.pravatar.cc/400?img=5',
    date_count: 5,
    last_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    avg_rating: 5.0,
    status: 'exclusive',
    tags: ['Mindful', 'Active', 'Wine Enthusiast'],
    notes: 'Amazing connection! Planning a weekend trip to Napa.'
  },
  {
    id: 'demo-roster-4',
    person_name: 'David Martinez',
    person_age: 29,
    person_occupation: 'Startup Founder',
    person_location: 'Mountain View, CA',
    person_bio: 'Building the future, one startup at a time',
    person_interests: ['Entrepreneurship', 'Rock Climbing', 'Podcasts'],
    person_instagram: '@davidmartinez',
    person_image_url: 'https://i.pravatar.cc/400?img=8',
    date_count: 1,
    last_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    avg_rating: 3.5,
    status: 'paused',
    tags: ['Entrepreneur', 'Ambitious', 'Climber'],
    notes: 'Interesting person but very busy schedule. Maybe reconnect later.'
  }
];

export const DEMO_DATES = [
  {
    id: 'demo-date-1',
    person_name: 'Sarah Johnson',
    person_id: 'demo-roster-3',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Blue Bottle Coffee',
    rating: 5,
    tags: ['Coffee Date', 'Great Conversation', 'Chemistry'],
    notes: 'Perfect afternoon coffee date. Talked for hours about travel plans.',
    photos: [],
    is_second_date: false
  },
  {
    id: 'demo-date-2',
    person_name: 'Emma Wilson',
    person_id: 'demo-roster-1',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'The Grove Restaurant',
    rating: 4,
    tags: ['Dinner', 'Wine', 'Romantic'],
    notes: 'Lovely dinner with great ambiance. She loved the wine selection.',
    photos: [],
    is_second_date: true
  },
  {
    id: 'demo-date-3',
    person_name: 'Michael Chen',
    person_id: 'demo-roster-2',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Ramen Nagi',
    rating: 4,
    tags: ['Lunch', 'Casual', 'Fun'],
    notes: 'Great ramen spot he recommended. Will definitely go back.',
    photos: [],
    is_second_date: false
  },
  {
    id: 'demo-date-4',
    person_name: 'Sarah Johnson',
    person_id: 'demo-roster-3',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Yoga Studio',
    rating: 5,
    tags: ['Active', 'Morning', 'Healthy'],
    notes: 'Morning yoga session together. Felt amazing and connected.',
    photos: [],
    is_second_date: true
  },
  {
    id: 'demo-date-5',
    person_name: 'Emma Wilson',
    person_id: 'demo-roster-1',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Golden Gate Park',
    rating: 4.5,
    tags: ['Outdoor', 'Picnic', 'Sunny'],
    notes: 'Beautiful day for a picnic. She brought homemade sandwiches!',
    photos: [],
    is_second_date: false
  }
];

export const DEMO_CIRCLES = [
  {
    id: 'demo-circle-1',
    name: 'Bay Area Singles',
    description: 'Active dating community in the Bay Area',
    member_count: 12,
    created_by: 'demo-user',
    members: [
      { name: 'Alex Demo', image: 'https://i.pravatar.cc/400?img=10' },
      { name: 'Jamie Lee', image: 'https://i.pravatar.cc/400?img=11' },
      { name: 'Chris Taylor', image: 'https://i.pravatar.cc/400?img=12' },
      { name: 'Morgan Smith', image: 'https://i.pravatar.cc/400?img=13' }
    ]
  },
  {
    id: 'demo-circle-2',
    name: 'Coffee Date Club',
    description: 'For those who prefer casual coffee dates',
    member_count: 8,
    created_by: 'demo-user-2',
    members: [
      { name: 'Alex Demo', image: 'https://i.pravatar.cc/400?img=10' },
      { name: 'Sam Wilson', image: 'https://i.pravatar.cc/400?img=14' },
      { name: 'Riley Jones', image: 'https://i.pravatar.cc/400?img=15' }
    ]
  }
];

export const DEMO_FEED_POSTS = [
  {
    id: 'demo-post-1',
    user_name: 'Jamie Lee',
    user_image: 'https://i.pravatar.cc/400?img=11',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'date_entry',
    content: 'Just had an amazing dinner date at The French Laundry! 🍷',
    person_name: 'Alex Thompson',
    rating: 5,
    location: 'The French Laundry',
    likes: 24,
    comments: [
      {
        user_name: 'Chris Taylor',
        comment: 'That place is incredible! Lucky you!',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        user_name: 'Morgan Smith',
        comment: 'Details please! How was the wine pairing?',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'demo-post-2',
    user_name: 'Chris Taylor',
    user_image: 'https://i.pravatar.cc/400?img=12',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'roster_update',
    content: 'Added someone new to my roster! Met at a wine tasting event 🍇',
    person_name: 'Jordan Blake',
    likes: 18,
    comments: [
      {
        user_name: 'Alex Demo',
        comment: 'Wine tasting dates are the best!',
        created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'demo-post-3',
    user_name: 'Morgan Smith',
    user_image: 'https://i.pravatar.cc/400?img=13',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'insight',
    content: 'Dating tip: Always suggest a place you know well for first dates. Confidence is key! 💫',
    likes: 42,
    comments: [
      {
        user_name: 'Jamie Lee',
        comment: 'Great advice! Home court advantage 😄',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_name: 'Sam Wilson',
        comment: 'This is so true. My go-to spot never fails!',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

export const DEMO_USER_STATS = {
  totalDates: 15,
  activeConnections: 3,
  avgRating: 4.3,
  circles: 2,
  secondDateRate: 60,
  datesThisMonth: 5,
  datesLastMonth: 4,
  mostUsedTags: [
    { tag: 'Coffee Date', usage_count: 8 },
    { tag: 'Dinner', usage_count: 6 },
    { tag: 'Great Conversation', usage_count: 5 }
  ],
  longestConnections: [
    { person_name: 'Sarah Johnson', date_count: 5 },
    { person_name: 'Emma Wilson', date_count: 3 }
  ],
  datingTrends: [
    { month_year: 'January 2024', date_count: 4 },
    { month_year: 'February 2024', date_count: 5 },
    { month_year: 'March 2024', date_count: 6 }
  ]
};

/**
 * Initialize demo data for App Store review
 */
export async function initializeDemoData() {
  // This would typically populate the database with demo data
  // For now, we'll return the demo data structure
  return {
    credentials: DEMO_CREDENTIALS,
    roster: DEMO_ROSTER,
    dates: DEMO_DATES,
    circles: DEMO_CIRCLES,
    feed: DEMO_FEED_POSTS,
    stats: DEMO_USER_STATS
  };
}

/**
 * Check if current user is demo user
 */
export function isDemoUser(email?: string): boolean {
  return email === DEMO_CREDENTIALS.email;
}

/**
 * Get demo data for a specific section
 */
export function getDemoData(section: 'roster' | 'dates' | 'circles' | 'feed' | 'stats') {
  switch (section) {
    case 'roster':
      return DEMO_ROSTER;
    case 'dates':
      return DEMO_DATES;
    case 'circles':
      return DEMO_CIRCLES;
    case 'feed':
      return DEMO_FEED_POSTS;
    case 'stats':
      return DEMO_USER_STATS;
    default:
      return null;
  }
}