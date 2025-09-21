import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useProfileData, type ProfileData } from '../utils/profileDataUtils';

export interface HomeProfileState {
  profileData: ProfileData | null;
  isLoadingProfile: boolean;
  showProfileModal: boolean;
}

export interface HomeProfileActions {
  setShowProfileModal: (show: boolean) => void;
}

export function useHomeProfile(session: Session | null) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { profileData, isLoading: isLoadingProfile } = useProfileData(session);

  const profileState: HomeProfileState = {
    profileData,
    isLoadingProfile,
    showProfileModal
  };

  const profileActions: HomeProfileActions = {
    setShowProfileModal
  };

  return { profileState, profileActions };
}