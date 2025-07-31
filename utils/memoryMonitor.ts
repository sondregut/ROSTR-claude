import { Image } from 'expo-image';
import { AppState, AppStateStatus } from 'react-native';

class MemoryMonitor {
  private isMonitoring = false;
  private appStateSubscription: any;
  
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Log memory usage in development
    if (__DEV__) {
      setInterval(() => {
        // @ts-ignore - performance.memory is available in Chrome debugger
        if (typeof performance !== 'undefined' && performance.memory) {
          const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
          const usagePercent = (usedJSHeapSize / totalJSHeapSize) * 100;
          
          if (usagePercent > 80) {
            console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(1)}%`);
            this.clearCaches();
          }
        }
      }, 30000); // Check every 30 seconds
    }
  }
  
  stopMonitoring() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.isMonitoring = false;
  }
  
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      // Clear caches when app goes to background
      this.clearCaches();
    }
  };
  
  private clearCaches() {
    try {
      // Clear expo-image cache
      Image.clearDiskCache();
      Image.clearMemoryCache();
      
      console.log('✅ Memory caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }
  
  // Manual cache clear method
  clearImageCache() {
    this.clearCaches();
  }
}

export const memoryMonitor = new MemoryMonitor();