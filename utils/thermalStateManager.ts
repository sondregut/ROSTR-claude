import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

export type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';

interface ThermalStateChangeEvent {
  thermalState: ThermalState;
}

class ThermalStateManager {
  private currentState: ThermalState = 'nominal';
  private listeners: Set<(state: ThermalState) => void> = new Set();
  private eventEmitter: NativeEventEmitter | null = null;
  private subscription: any = null;

  constructor() {
    // Only available on iOS
    if (Platform.OS === 'ios' && NativeModules.ProcessInfo) {
      try {
        this.eventEmitter = new NativeEventEmitter(NativeModules.ProcessInfo);
        
        // Get initial thermal state
        this.updateThermalState();
        
        // Listen for thermal state changes
        this.subscription = this.eventEmitter.addListener(
          'thermalStateDidChange',
          (event: ThermalStateChangeEvent) => {
            this.handleThermalStateChange(event.thermalState);
          }
        );
      } catch (error) {
        console.warn('[ThermalStateManager] Failed to initialize:', error);
      }
    }
  }

  private updateThermalState() {
    if (Platform.OS === 'ios' && NativeModules.ProcessInfo?.getThermalState) {
      NativeModules.ProcessInfo.getThermalState((state: ThermalState) => {
        this.currentState = state;
        console.log('[ThermalStateManager] Current thermal state:', state);
      });
    }
  }

  private handleThermalStateChange(state: ThermalState) {
    console.log('[ThermalStateManager] Thermal state changed to:', state);
    this.currentState = state;
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('[ThermalStateManager] Listener error:', error);
      }
    });
  }

  getThermalState(): ThermalState {
    return this.currentState;
  }

  isDeviceHot(): boolean {
    return this.currentState === 'serious' || this.currentState === 'critical';
  }

  shouldDisableAnimations(): boolean {
    // Disable animations when device is warm or hotter
    return this.currentState !== 'nominal';
  }

  addListener(listener: (state: ThermalState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  cleanup() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const thermalStateManager = new ThermalStateManager();

// Helper hook for React components
import { useEffect, useState } from 'react';

export function useThermalState() {
  const [thermalState, setThermalState] = useState<ThermalState>(
    thermalStateManager.getThermalState()
  );
  const [shouldDisableAnimations, setShouldDisableAnimations] = useState(
    thermalStateManager.shouldDisableAnimations()
  );

  useEffect(() => {
    // Set initial state
    setThermalState(thermalStateManager.getThermalState());
    setShouldDisableAnimations(thermalStateManager.shouldDisableAnimations());

    // Listen for changes
    const unsubscribe = thermalStateManager.addListener((state) => {
      setThermalState(state);
      setShouldDisableAnimations(thermalStateManager.shouldDisableAnimations());
    });

    return unsubscribe;
  }, []);

  return {
    thermalState,
    isDeviceHot: thermalStateManager.isDeviceHot(),
    shouldDisableAnimations,
  };
}