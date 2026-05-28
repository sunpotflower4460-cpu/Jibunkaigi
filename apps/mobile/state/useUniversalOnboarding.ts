import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createDefaultUserProfile,
  normalizeUserName,
} from '@jibunkaigi/shared';
import { createUserProfileRepository } from '../services/userProfileRepository';

const ONBOARDING_COMPLETED_KEY = 'jibunkaigi:onboarding-complete';

interface UseUniversalOnboardingReturn {
  hasCompletedOnboarding: boolean;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isLoadingProfile: boolean;
}

export function useUniversalOnboarding(): UseUniversalOnboardingReturn {
  const repositoryRef = useRef(createUserProfileRepository());
  const hydratedRef = useRef(false);
  const userNameRef = useRef(createDefaultUserProfile().userName);

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userName, setUserNameState] = useState(createDefaultUserProfile().userName);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoadingProfile(true);
      try {
        const [profile, completedFlag] = await Promise.all([
          repositoryRef.current.loadProfile(),
          AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY),
        ]);
        if (cancelled) return;
        setUserNameState(profile.userName);
        setHasCompletedOnboarding(completedFlag === 'true');
      } catch {
        if (!cancelled) {
          setUserNameState(createDefaultUserProfile().userName);
          setHasCompletedOnboarding(false);
        }
      } finally {
        hydratedRef.current = true;
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistUserName = useCallback(async (name: string) => {
    const normalized = normalizeUserName(name);
    setUserNameState(normalized);
    if (!hydratedRef.current) return;

    try {
      await repositoryRef.current.saveProfile({
        userName: normalized,
        updatedAt: Date.now(),
      });
    } catch {
      console.warn('[Jibunkaigi] Failed to persist user name.');
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    const normalized = normalizeUserName(userNameRef.current);
    setUserNameState(normalized);
    setHasCompletedOnboarding(true);

    try {
      await Promise.all([
        repositoryRef.current.saveProfile({
          userName: normalized,
          updatedAt: Date.now(),
        }),
        AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true'),
      ]);
    } catch {
      console.warn('[Jibunkaigi] Failed to persist onboarding state.');
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(false);
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch {
      console.warn('[Jibunkaigi] Failed to reset onboarding state.');
    }
  }, []);

  return {
    hasCompletedOnboarding,
    userName,
    setUserName: persistUserName,
    completeOnboarding,
    resetOnboarding,
    isLoadingProfile,
  };
}
