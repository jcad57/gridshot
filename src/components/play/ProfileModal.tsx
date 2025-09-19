import { useState, useEffect } from 'react';
import { supabase } from '../../../util/supabase';
import type { Session } from '@supabase/supabase-js';

interface ProfileData {
  username?: string;
  level: number;
  accuracy: number;
  streak: number;
  bullseyes: number;
  score: number;
  email?: string;
}

interface ProfileModalProps {
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  userEmail?: string;
}

export default function ProfileModal({ 
  showProfileModal, 
  setShowProfileModal, 
  userEmail 
}: ProfileModalProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Fetch session and profile data when modal opens
  useEffect(() => {
    if (showProfileModal) {
      fetchProfileData();
    }
  }, [showProfileModal]);

  const fetchProfileData = async () => {
    try {
      setIsLoadingProfile(true);
      
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (!currentSession?.user?.id) {
        console.error('No user session found');
        return;
      }

      // Fetch profile data from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('username, level, accuracy, streak, bullseyes, score')
        .eq('user_id', currentSession.user.id)
        .single();
      console.log("Profile data:", data);
      if (error) {
        console.error("Error fetching profile data:", error);
        // If profile doesn't exist, create one with default values
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: currentSession.user.id,
            username: currentSession.user.user_metadata?.username || undefined,
            level: 1,
            accuracy: 0,
            streak: 0,
            bullseyes: 0,
            score: 0
          })
          .select('username, level, accuracy, streak, bullseyes, score')
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          setProfileData(newProfile);
        }
      } else {
        setProfileData(data);
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  if (!showProfileModal) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
        onClick={() => setShowProfileModal(false)}
      />
      
      {/* Modal */}
      <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-[80] transform transition-transform duration-300 ease-out ${
        showProfileModal ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
          <button 
            onClick={() => setShowProfileModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">👤</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {profileData?.username || (userEmail ? userEmail.split('@')[0] : 'Player')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profileData ? `Level ${profileData.level}` : 'Loading...'}
              </p>
              {profileData?.username && userEmail && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Game Stats</h4>
            
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading stats...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {profileData?.score || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Score</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {profileData ? `${profileData.accuracy.toFixed(1)}%` : '0.0%'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Accuracy</div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {profileData?.bullseyes || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Bullseyes</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {profileData?.streak || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Highest Streak</div>
                </div>
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Recent Achievements</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-xl">🏆</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Perfect Score</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Scored 100 points</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-xl">🔥</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Streak Master</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">10+ game streak</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Speed Demon</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Under 2s average</div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Settings</h4>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 dark:text-gray-400">⚙️</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Game Settings</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 dark:text-gray-400">📊</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">View Statistics</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 dark:text-gray-400">🏆</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Achievements</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
