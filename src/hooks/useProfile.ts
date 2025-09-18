import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../util/supabase';
import type { Session } from '@supabase/supabase-js';


export interface ProfileActions {
  setShowProfileModal: (show: boolean) => void;
  loadProfile: () => Promise<void>;
}

export interface ProfileState {
  session: Session | null;
  isLoadingProfile: boolean;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

export interface ProfileData {
  level: number;
  accuracy: number;
  streak: number;
  bullseyes: number;
  score: number;
}

export function useProfile() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Load profile data from database
  const loadProfile = useCallback(async (): Promise<ProfileData | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user?.id) {
        // Load initial stats from database
        const { data, error } = await supabase
          .from('profiles')
          .select('level, accuracy, streak, bullseyes, score')
          .eq('user_id', session.user.id)
          .single();

        if (!error && data) {
          return {
            level: data.level || 1,
            accuracy: data.accuracy || 0,
            streak: data.streak || 0,
            bullseyes: data.bullseyes || 0,
            score: data.score || 0
          };
        } else {
          // If no profile exists, return default values
          return {
            level: 1,
            accuracy: 0,
            streak: 0,
            bullseyes: 0,
            score: 0
          };
        }
      } else {
        // No session, return default values
        return {
          level: 1,
          accuracy: 0,
          streak: 0,
          bullseyes: 0,
          score: 0
        };
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Return default values on error
      return {
        level: 1,
        accuracy: 0,
        streak: 0,
        bullseyes: 0,
        score: 0
      };
    } finally {
      // Always set loading to false when done
      setIsLoadingProfile(false);
    }
  }, []);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const profileState: ProfileState = {
    session,
    isLoadingProfile,
    showProfileModal,
    setShowProfileModal
  };

  const actions: ProfileActions = {
    setShowProfileModal,
    loadProfile
  };

  return { profileState, actions, loadProfile };
}
