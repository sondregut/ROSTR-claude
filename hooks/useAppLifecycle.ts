import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { InteractionManager } from 'react-native';

interface LifecycleCallbacks {
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
}

/**
 * Hook to handle app lifecycle events and manage animations
 * Helps prevent watchdog timeouts during scene transitions
 */
export function useAppLifecycle(callbacks?: LifecycleCallbacks) {
  const appState = useRef(AppState.currentState);
  const animationHandles = useRef<Set<number>>(new Set());
  
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Cancel all pending animations when going to background
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Cancel all tracked animations
        animationHandles.current.forEach(handle => {
          InteractionManager.clearInteractionHandle(handle);
        });
        animationHandles.current.clear();
        
        // Call appropriate callback
        if (nextAppState === 'background') {
          callbacks?.onBackground?.();
        } else {
          callbacks?.onInactive?.();
        }
      }
      
      // Handle foreground transition
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        callbacks?.onForeground?.();
      }
      
      appState.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      // Clear any remaining animations
      animationHandles.current.forEach(handle => {
        InteractionManager.clearInteractionHandle(handle);
      });
    };
  }, [callbacks]);
  
  /**
   * Run a task after all interactions/animations complete
   * Automatically cancelled if app goes to background
   */
  const runAfterInteractions = (task: () => void) => {
    const handle = InteractionManager.runAfterInteractions(() => {
      animationHandles.current.delete(handle);
      task();
    });
    animationHandles.current.add(handle);
    
    return () => {
      InteractionManager.clearInteractionHandle(handle);
      animationHandles.current.delete(handle);
    };
  };
  
  /**
   * Schedule a task with a delay, automatically cancelled on background
   */
  const scheduleTask = (task: () => void, delay: number = 0) => {
    let timeoutId: NodeJS.Timeout;
    
    const handle = InteractionManager.createInteractionHandle();
    animationHandles.current.add(handle);
    
    timeoutId = setTimeout(() => {
      InteractionManager.clearInteractionHandle(handle);
      animationHandles.current.delete(handle);
      task();
    }, delay);
    
    return () => {
      clearTimeout(timeoutId);
      InteractionManager.clearInteractionHandle(handle);
      animationHandles.current.delete(handle);
    };
  };
  
  return {
    appState: appState.current,
    runAfterInteractions,
    scheduleTask,
  };
}