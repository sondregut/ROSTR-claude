import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/productionLogger';

export interface ReferralData {
  ref: string;
  phone?: string;
  invited_by?: string;
  circle?: string;
  username?: string;
}

interface ReferralContextType {
  referralData: ReferralData | null;
  setReferralData: (data: ReferralData | null) => Promise<void>;
  clearReferralData: () => Promise<void>;
  hasReferralData: boolean;
}

const ReferralContext = createContext<ReferralContextType | null>(null);

const REFERRAL_STORAGE_KEY = '@rostrdating:referral_data';

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const [referralData, setReferralDataState] = useState<ReferralData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load referral data from storage on mount
  useEffect(() => {
    const loadReferralData = async () => {
      try {
        const stored = await AsyncStorage.getItem(REFERRAL_STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored) as ReferralData;
          logger.debug('📋 Loaded stored referral data:', data);
          setReferralDataState(data);
        }
      } catch (error) {
        logger.debug('Failed to load referral data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadReferralData();
  }, []);

  const setReferralData = async (data: ReferralData | null) => {
    try {
      if (data) {
        await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(data));
        logger.debug('💾 Stored referral data:', data);
      } else {
        await AsyncStorage.removeItem(REFERRAL_STORAGE_KEY);
        logger.debug('🗑️ Cleared referral data');
      }
      setReferralDataState(data);
    } catch (error) {
      logger.debug('Failed to store referral data:', error);
    }
  };

  const clearReferralData = async () => {
    await setReferralData(null);
  };

  const contextValue: ReferralContextType = {
    referralData,
    setReferralData,
    clearReferralData,
    hasReferralData: !!referralData,
  };

  // Don't render children until we've loaded from storage
  if (!isLoaded) {
    return null;
  }

  return (
    <ReferralContext.Provider value={contextValue}>
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferral(): ReferralContextType {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
}