import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../util/supabase';
import type { Session } from '@supabase/supabase-js';


export interface ProfileActions {
  setShowProfileModal: (show: boolean) => void;
  loadProfile: () => Promise<void>;
}

export interface ProfileState {
  session: Session | null;
  profileData: ProfileData | null;
  isLoadingProfile: boolean;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

export interface ProfileData {
  username?: string;
  level: number;
  accuracy: number;
  streak: number;
  bullseyes: number;
  score: number;
  shot_attempts?: number;
}

export function useProfile() {
  const [session, setSession] = useState<Session | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Load profile data from database
  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingProfile(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user?.id) {
        // Load initial stats from database
        const { data, error } = await supabase
          .from('profiles')
          .select('username, level, accuracy, streak, bullseyes, score, shot_attempts')
          .eq('user_id', session.user.id)
          .single();

        if (!error && data) {
          const profileData = {
            username: data.username || undefined,
            level: data.level || 1,
            accuracy: data.accuracy || 0,
            streak: data.streak || 0,
            bullseyes: data.bullseyes || 0,
            score: data.score || 0,
            shot_attempts: data.shot_attempts || 0
          };
          setProfileData(profileData);
        } else {
          // If no profile exists, create one with default values
          const defaultProfile = {
            username: session.user.user_metadata?.username || undefined,
            level: 1,
            accuracy: 0,
            streak: 0,
            bullseyes: 0,
            score: 0,
            shot_attempts: 0
          };
          
          // Try to create the profile in the database
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: session.user.id,
              username: defaultProfile.username,
              level: defaultProfile.level,
              accuracy: defaultProfile.accuracy,
              streak: defaultProfile.streak,
              bullseyes: defaultProfile.bullseyes,
              score: defaultProfile.score,
              shot_attempts: defaultProfile.shot_attempts
            })
            .select('username, level, accuracy, streak, bullseyes, score, shot_attempts')
            .single();

          if (insertError) {
            console.error("Error creating profile:", insertError);
            // Use default values even if creation fails
            setProfileData(defaultProfile);
          } else {
            setProfileData(newProfile);
          }
        }
      } else {
        // No session, use default values
        setProfileData({
          username: undefined,
          level: 1,
          accuracy: 0,
          streak: 0,
          bullseyes: 0,
          score: 0,
          shot_attempts: 0
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Set default values on error
      setProfileData({
        username: undefined,
        level: 1,
        accuracy: 0,
        streak: 0,
        bullseyes: 0,
        score: 0,
        shot_attempts: 0
      });
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
    profileData,
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
