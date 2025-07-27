import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  // Generic methods for any data type
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Specific methods for app data
  async mergeItem<T extends object>(key: string, value: Partial<T>): Promise<void> {
    try {
      const existingValue = await this.getItem<T>(key);
      const mergedValue = existingValue ? { ...existingValue, ...value } : value;
      await this.setItem(key, mergedValue);
    } catch (error) {
      console.error(`Error merging ${key}:`, error);
      throw error;
    }
  }

  // Check if key exists
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Error checking ${key}:`, error);
      return false;
    }
  }

  // Get multiple items at once
  async getMultiple<T>(keys: string[]): Promise<{ [key: string]: T | null }> {
    try {
      const values = await AsyncStorage.multiGet(keys);
      const result: { [key: string]: T | null } = {};
      
      values.forEach(([key, value]) => {
        result[key] = value ? JSON.parse(value) : null;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting multiple items:', error);
      throw error;
    }
  }

  // Storage keys used in the app
  static KEYS = {
    USER_PROFILE: '@user_profile',
    THEME_MODE: '@theme_mode',
    ROSTER_DATA: '@roster_data',
    CIRCLES_DATA: '@circles_data',
    DRAFT_DATE_ENTRY: '@draft_date_entry',
  };
}

export const storage = new StorageService();
export const StorageKeys = StorageService.KEYS;