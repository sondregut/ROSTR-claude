import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export async function clearAllAuthData() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all AsyncStorage data related to Supabase
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') ||
      key.includes('session')
    );
    
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('Cleared auth keys:', supabaseKeys);
    }
    
    // Clear all storage (nuclear option)
    await AsyncStorage.clear();
    console.log('✅ All auth data cleared successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
}