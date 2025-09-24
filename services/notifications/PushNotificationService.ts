import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { notificationService } from './NotificationService';
import { Notifications, isNotificationsAvailable } from './notificationHelpers';
import { Device } from '@/utils/deviceHelpers';

// Check if running in Expo Go (production builds and dev clients can handle push notifications)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure notification handler only if notifications are available
if (isNotificationsAvailable) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.log('Failed to set notification handler:', error);
  }
}

export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: boolean;
}

class PushNotificationService {
  private notificationListener: any;
  private responseListener: any;

  // Initialize push notifications
  async initialize(userId: string) {
    try {
      if (isExpoGo) {
        console.log('Push notifications are limited in Expo Go. Build a development client for full functionality.');
        // Still set up listeners for local notifications
        this.setupNotificationListeners();
        return;
      }

      // Register for push notifications
      const token = await this.registerForPushNotifications();
      
      if (token && userId) {
        // Save token to database
        await notificationService.savePushToken(
          userId,
          token,
          Platform.OS as 'ios' | 'android',
          {
            device_id: Constants.deviceId,
            app_version: Constants.expoConfig?.version,
            os_version: Device.osVersion || undefined,
          }
        );
      }

      // Set up notification listeners
      this.setupNotificationListeners();
    } catch (error) {
      console.log('Failed to initialize push notifications:', error);
      // Still set up listeners for local notifications
      this.setupNotificationListeners();
    }
  }

  // Register for push notifications and get token
  async registerForPushNotifications(): Promise<string | null> {
    try {
      let token = null;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // This will throw in Expo Go
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;

      return token;
    } catch (error) {
      console.log('Cannot get push token in current environment:', error);
      return null;
    }
  }

  // Set up notification listeners
  private setupNotificationListeners() {
    // Handle notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle notification response (when user taps notification)
  private handleNotificationResponse(response: any) {
    const { notification } = response;
    const data = notification.request.content.data;

    // Handle different notification types
    if (data) {
      switch (data.type) {
        case 'like':
        case 'reaction':
        case 'comment':
          // Navigate to the specific date entry
          if (data.dateId) {
            // TODO: Navigate to date detail or feed with specific date highlighted
            console.log('Navigate to date:', data.dateId);
          }
          break;
        
        case 'friend_date':
        case 'friend_roster':
        case 'friend_plan':
          // Navigate to friend's profile or feed
          if (data.friendId) {
            // TODO: Navigate to friend's profile
            console.log('Navigate to friend:', data.friendId);
          }
          break;
        
        case 'circle_invite':
          // Navigate to circles page
          if (data.circleId) {
            // TODO: Navigate to circle detail
            console.log('Navigate to circle:', data.circleId);
          }
          break;
        
        default:
          // Navigate to notifications page
          console.log('Navigate to notifications');
          break;
      }
    }
  }

  // Schedule a local notification
  async scheduleLocalNotification(content: NotificationContent, trigger?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data,
        badge: content.badge,
        sound: content.sound ?? true,
      },
      trigger: trigger || null, // null means immediate
    });
  }

  // Cancel all scheduled notifications
  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.log('Cannot get badge count:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.log('Cannot set badge count:', error);
    }
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Get notification permissions status
  async getPermissionsStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.log('Cannot get permissions status:', error);
      return 'undetermined';
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<string> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status;
    } catch (error) {
      console.log('Cannot request permissions:', error);
      return 'undetermined';
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const status = await this.getPermissionsStatus();
      return status === 'granted';
    } catch (error) {
      console.log('Cannot check if notifications are enabled:', error);
      return false;
    }
  }

  // Present notification immediately (for testing)
  async presentNotification(content: NotificationContent) {
    await Notifications.presentNotificationAsync({
      title: content.title,
      body: content.body,
      data: content.data,
      badge: content.badge,
      sound: content.sound ?? true,
    });
  }
}

export const pushNotificationService = new PushNotificationService();