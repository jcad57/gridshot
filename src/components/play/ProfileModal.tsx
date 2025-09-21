import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../../util/supabase';
import type { Session } from '@supabase/supabase-js';
import { useProfileData, type ProfileData } from '../../utils/profileDataUtils';

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
  const [session, setSession] = useState<Session | null>(null);
  const { profileData, isLoading: isLoadingProfile } = useProfileData(session);

  // Fetch session when modal opens
  useEffect(() => {
    if (showProfileModal) {
      const fetchSession = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      };
      fetchSession();
    }
  }, [showProfileModal]);

  if (!showProfileModal) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
        onClick={() => setShowProfileModal(false)}
      />
      
      {/* Modal */}
      <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-[80] transform transition-transform duration-300 ease-out flex flex-col ${
        showProfileModal ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Close Button - Floating */}
        <button 
          onClick={() => setShowProfileModal(false)}
          className="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 pb-8 space-y-6 relative">
          {/* Scroll fade indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none z-10"></div>
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
              <Link 
                to="/settings" 
                className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowProfileModal(false)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 dark:text-gray-400">⚙️</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Game Settings</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link 
                to="/profile" 
                className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowProfileModal(false)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 dark:text-gray-400">📊</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">View Statistics</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link 
                to="/leaderboard" 
                className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowProfileModal(false)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 dark:text-gray-400">🏆</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Leaderboard</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
