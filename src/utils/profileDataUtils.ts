import { useState, useEffect } from 'react';
import { supabase } from '../../util/supabase';
import type { Session } from '@supabase/supabase-js';

export interface ProfileData {
  username?: string;
  level: number;
  accuracy: number;
  streak: number;
  bullseyes: number;
  score: number;
  shot_attempts?: number;
  email?: string;
}

export interface ProfileFetchResult {
  data: ProfileData | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Fetches user profile data from Supabase
 * @param session - The user session
 * @returns Promise<ProfileFetchResult> - The profile data, error, and loading state
 */
export async function fetchUserProfile(session: Session | null): Promise<ProfileFetchResult> {
  if (!session?.user?.id) {
    return {
      data: null,
      error: 'No user session found',
      isLoading: false
    };
  }

  try {
    // Fetch profile data from Supabase using user_id
    const { data, error } = await supabase
      .from('profiles')
      .select('username, level, accuracy, streak, bullseyes, score, shot_attempts')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile data:', error);
      return {
        data: null,
        error: error.message,
        isLoading: false
      };
    }

    if (data) {
      // Add email to the profile data for convenience
      const profileData: ProfileData = {
        ...data,
        email: session.user.email
      };

      console.log('Profile data fetched successfully:', profileData);
      return {
        data: profileData,
        error: null,
        isLoading: false
      };
    }

    return {
      data: null,
      error: 'No profile data found',
      isLoading: false
    };
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      isLoading: false
    };
  }
}

/**
 * Gets the display name for a user (username, email prefix, or fallback)
 * @param profileData - The profile data
 * @param session - The user session
 * @returns string - The display name
 */
export function getDisplayName(profileData: ProfileData | null, session: Session | null): string {
  if (profileData?.username) {
    return profileData.username;
  }
  
  if (session?.user?.email) {
    return session.user.email.split('@')[0];
  }
  
  return 'Player';
}

/**
 * Hook-like function for fetching profile data with state management
 * This can be used in components that need reactive profile data
 */
export function useProfileData(session: Session | null) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!session) {
        setProfileData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      const result = await fetchUserProfile(session);
      
      setProfileData(result.data);
      setError(result.error);
      setIsLoading(false);
    };

    loadProfileData();
  }, [session?.user?.id]);

  return {
    profileData,
    isLoading,
    error,
    displayName: getDisplayName(profileData, session)
  };
}

