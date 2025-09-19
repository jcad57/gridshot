import { useState, useEffect } from 'react';
import { fetchLeaderboard, type LeaderboardPlayer } from '../../../util/supabase';

interface LeaderboardProps {
  currentUserScore?: number;
}

export default function Leaderboard({ currentUserScore }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await fetchLeaderboard();
        
        if (result.success && result.data) {
          setLeaderboardData(result.data);
        } else {
          setError('Failed to load leaderboard data');
          console.error('Leaderboard fetch error:', result.error);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Leaderboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  const formatAccuracy = (accuracy: number) => {
    return `${accuracy.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Leaderboard</h3>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <h2 className="text-3xl font-bold text-white text-center mb-2">🏆 Leaderboard</h2>
          <p className="text-blue-100 text-center">Top 10 Gridshot Masters</p>
        </div>

        {/* Leaderboard List */}
        <div className="p-6">
          {leaderboardData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Players Yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Be the first to set a score!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboardData.map((player, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;
                
                return (
                  <div
                    key={player.user_id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                      isTopThree
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-700 shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                    }`}
                  >
                    {/* Rank and Player Info */}
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                        isTopThree
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {getRankIcon(rank)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {player.username || `Player #${player.user_id.slice(-8)}`}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isTopThree
                              ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          }`}>
                            Level {player.level}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span>🎯 {player.bullseyes} bullseyes</span>
                          <span>🔥 {player.streak} streak</span>
                          <span>📊 {formatAccuracy(player.accuracy)} accuracy</span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        isTopThree
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-purple-600 dark:text-purple-400'
                      }`}>
                        {formatScore(player.score)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Current User Score Indicator */}
          {currentUserScore && (
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="text-center">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Your Current Score: </span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatScore(currentUserScore)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
