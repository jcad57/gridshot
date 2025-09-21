import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "../../util/supabase";
import type { Session } from "@supabase/supabase-js";
import { useTheme } from "../../src/components/ThemeProvider";

interface ProfileData {
  username?: string;
  level: number;
  accuracy: number;
  streak: number;
  bullseyes: number;
  score: number;
  shot_attempts?: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // User is not authenticated, redirect to auth
          navigate("/auth");
          return;
        }

        setSession(session);

        // Fetch profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('username, level, accuracy, streak, bullseyes, score, shot_attempts')
          .eq('user_id', session.user.id)
          .single();

        if (!error && data) {
          setProfileData(data);
        } else {
          console.error("Error fetching profile data:", error);
          // Set default values if profile doesn't exist
          setProfileData({
            username: session.user.user_metadata?.username || undefined,
            level: 1,
            accuracy: 0,
            streak: 0,
            bullseyes: 0,
            score: 0,
            shot_attempts: 0
          });
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, [navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'red' ? 'bg-gradient-to-br from-red-950 via-gray-900 to-red-950' : 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'} text-white flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'red' ? 'border-red-500' : 'border-blue-500'} mx-auto mb-4`}></div>
          <p className="text-lg text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen ${theme === 'red' ? 'bg-gradient-to-br from-red-950 via-gray-900 to-red-950' : 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'} text-white`}>
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/"
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-white">Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/leaderboard"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Leaderboard
              </Link>
              <Link 
                to="/play"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Play Game
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
                  <span className="text-white font-bold text-4xl">👤</span>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {profileData?.username || (session?.user.email ? session.user.email.split('@')[0] : 'Player')}
                  </h2>
                  <p className="text-gray-400">Level {profileData?.level || 1} Player</p>
                  {session?.user.email && profileData?.username && (
                    <p className="text-xs text-gray-500 mt-1">{session.user.email}</p>
                  )}
                  <div className="flex items-center justify-center mt-2">
                    <span className="text-yellow-400 text-sm">🎯 Gridshot Player</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-400">{profileData?.score?.toLocaleString() || '0'}</div>
                    <div className="text-xs text-gray-400">Total Score</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">{profileData?.accuracy?.toFixed(1) || '0.0'}%</div>
                    <div className="text-xs text-gray-400">Accuracy</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
                    <div className="text-2xl font-bold text-purple-400">{profileData?.streak || '0'}</div>
                    <div className="text-xs text-gray-400">Best Streak</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-4">
                    <div className="text-2xl font-bold text-orange-400">{profileData?.level || '1'}</div>
                    <div className="text-xs text-gray-400">Current Level</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Stats & Achievements */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Performance Overview */}
            <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Performance Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Accuracy</span>
                    <span className="text-white font-semibold">{profileData?.accuracy?.toFixed(1) || '0.0'}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: `${Math.min(profileData?.accuracy || 0, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Bullseyes</span>
                    <span className="text-white font-semibold">{profileData?.bullseyes || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full" style={{ width: `${Math.min((profileData?.bullseyes || 0) * 5, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Average Time</span>
                    <span className="text-white font-semibold">2.1s</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Shot Attempts</span>
                    <span className="text-white font-semibold">{profileData?.shot_attempts || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{ width: `${Math.min((profileData?.shot_attempts || 0) / 10, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Accuracy</span>
                    <span className="text-white font-semibold">94.7%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full" style={{ width: '94.7%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Consistency</span>
                    <span className="text-white font-semibold">A+</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Recent Achievements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Perfect Score</div>
                    <div className="text-gray-400 text-sm">Scored 100 points</div>
                    <div className="text-gray-500 text-xs">2 days ago</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Streak Master</div>
                    <div className="text-gray-400 text-sm">10+ game streak</div>
                    <div className="text-gray-500 text-xs">1 week ago</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Speed Demon</div>
                    <div className="text-gray-400 text-sm">Under 2s average</div>
                    <div className="text-gray-500 text-xs">2 weeks ago</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Sharpshooter</div>
                    <div className="text-gray-400 text-sm">95%+ accuracy</div>
                    <div className="text-gray-500 text-xs">3 weeks ago</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game History */}
            <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Recent Games</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">98</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Level 42</div>
                      <div className="text-gray-400 text-sm">2.1s • 156m distance</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">+98 pts</div>
                    <div className="text-gray-500 text-sm">2 min ago</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">100</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Level 42</div>
                      <div className="text-gray-400 text-sm">1.8s • Perfect!</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-semibold">+100 pts</div>
                    <div className="text-gray-500 text-sm">15 min ago</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">87</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Level 42</div>
                      <div className="text-gray-400 text-sm">2.5s • 234m distance</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400 font-semibold">+87 pts</div>
                    <div className="text-gray-500 text-sm">1 hour ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
