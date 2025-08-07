import { AppState, AppStateStatus, Animated } from 'react-native';
import { thermalStateManager } from './thermalStateManager';

class GlobalAnimationManager {
  private activeAnimations = new Set<Animated.CompositeAnimation>();
  private isAppActive = true;
  private animationRegistry = new Map<string, Animated.CompositeAnimation>();
  
  constructor() {
    // Listen to app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
  }
  
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('[AnimationManager] App state changing to:', nextAppState);
    
    if (nextAppState === 'inactive' || nextAppState === 'background') {
      this.isAppActive = false;
      this.cancelAllAnimations();
    } else if (nextAppState === 'active') {
      this.isAppActive = true;
    }
  };
  
  // Register an animation with optional ID
  registerAnimation(animation: Animated.CompositeAnimation, id?: string): Animated.CompositeAnimation {
    // Don't start new animations if app is not active or device is hot
    if (!this.isAppActive || thermalStateManager.shouldDisableAnimations()) {
      console.log('[AnimationManager] Blocking animation - app not active or device thermal state:', thermalStateManager.getThermalState());
      return animation;
    }
    
    this.activeAnimations.add(animation);
    if (id) {
      this.animationRegistry.set(id, animation);
    }
    
    // Wrap the start method to track lifecycle
    const originalStart = animation.start.bind(animation);
    animation.start = (callback?: (result: { finished: boolean }) => void) => {
      if (!this.isAppActive || thermalStateManager.shouldDisableAnimations()) {
        console.log('[AnimationManager] Preventing animation start - app not active or device hot');
        callback?.({ finished: false });
        return;
      }
      
      originalStart((result) => {
        this.activeAnimations.delete(animation);
        if (id) {
          this.animationRegistry.delete(id);
        }
        callback?.(result);
      });
    };
    
    return animation;
  }
  
  // Cancel all active animations
  cancelAllAnimations() {
    console.log(`[AnimationManager] Cancelling ${this.activeAnimations.size} active animations`);
    
    // Stop all tracked animations
    this.activeAnimations.forEach(animation => {
      try {
        animation.stop();
      } catch (error) {
        console.warn('[AnimationManager] Error stopping animation:', error);
      }
    });
    
    // Clear sets
    this.activeAnimations.clear();
    this.animationRegistry.clear();
    
    // Note: Animated.stopAllAnimations() doesn't exist in RN types
    // The individual animation.stop() calls above handle this
  }
  
  // Cancel specific animation by ID
  cancelAnimation(id: string) {
    const animation = this.animationRegistry.get(id);
    if (animation) {
      animation.stop();
      this.activeAnimations.delete(animation);
      this.animationRegistry.delete(id);
    }
  }
  
  // Check if app is active
  getIsAppActive(): boolean {
    return this.isAppActive;
  }
  
  // Safe animation wrappers
  timing(
    value: Animated.Value | Animated.ValueXY,
    config: Animated.TimingAnimationConfig
  ): Animated.CompositeAnimation {
    const animation = Animated.timing(value, config);
    return this.registerAnimation(animation);
  }
  
  spring(
    value: Animated.Value | Animated.ValueXY,
    config: Animated.SpringAnimationConfig
  ): Animated.CompositeAnimation {
    const animation = Animated.spring(value, config);
    return this.registerAnimation(animation);
  }
  
  parallel(
    animations: Animated.CompositeAnimation[],
    config?: Animated.ParallelConfig
  ): Animated.CompositeAnimation {
    const animation = Animated.parallel(animations, config);
    return this.registerAnimation(animation);
  }
  
  sequence(animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation {
    const animation = Animated.sequence(animations);
    return this.registerAnimation(animation);
  }
  
  loop(
    animation: Animated.CompositeAnimation,
    config?: Animated.LoopAnimationConfig
  ): Animated.CompositeAnimation {
    const loopAnimation = Animated.loop(animation, config);
    return this.registerAnimation(loopAnimation);
  }
}

// Export singleton instance
export const animationManager = new GlobalAnimationManager();

// Export convenient wrapper functions
export const SafeAnimated = {
  timing: animationManager.timing.bind(animationManager),
  spring: animationManager.spring.bind(animationManager),
  parallel: animationManager.parallel.bind(animationManager),
  sequence: animationManager.sequence.bind(animationManager),
  loop: animationManager.loop.bind(animationManager),
  
  // Direct access to manager methods
  cancelAll: () => animationManager.cancelAllAnimations(),
  cancel: (id: string) => animationManager.cancelAnimation(id),
  isActive: () => animationManager.getIsAppActive(),
};