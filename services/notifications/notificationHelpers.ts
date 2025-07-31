// Safe wrapper for expo-notifications to handle Expo Go limitations
let NotificationsModule: any = null;
let isNotificationsAvailable = false;

try {
  NotificationsModule = require('expo-notifications');
  isNotificationsAvailable = true;
} catch (error) {
  console.log('expo-notifications not available in this environment');
}

export const Notifications = NotificationsModule || {
  setNotificationHandler: () => {},
  getPermissionsAsync: async () => ({ status: 'undetermined' }),
  requestPermissionsAsync: async () => ({ status: 'undetermined' }),
  getExpoPushTokenAsync: async () => { throw new Error('Not available'); },
  addNotificationReceivedListener: () => ({ remove: () => {} }),
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  removeNotificationSubscription: () => {},
  scheduleNotificationAsync: async () => {},
  cancelAllScheduledNotificationsAsync: async () => {},
  getBadgeCountAsync: async () => 0,
  setBadgeCountAsync: async () => {},
  presentNotificationAsync: async () => {},
  setNotificationChannelAsync: async () => {},
  AndroidImportance: {
    MAX: 5,
  },
  PermissionStatus: {
    UNDETERMINED: 'undetermined',
    GRANTED: 'granted',
    DENIED: 'denied',
  },
};

export { isNotificationsAvailable };