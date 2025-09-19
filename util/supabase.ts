import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON
export const supabase = createClient(supabaseUrl, supabaseKey)

export interface LeaderboardPlayer {
  user_id: string;
  username?: string;
  level: number;
  accuracy: number;
  streak: number;
  bullseyes: number;
  score: number;
  shot_attempts?: number;
}

/**
 * Fetch top 10 players from the leaderboard sorted by score (highest to lowest)
 * @returns Promise with leaderboard data or error
 */
export const fetchLeaderboard = async (): Promise<{
  success: boolean;
  data: LeaderboardPlayer[] | null;
  error: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, level, accuracy, streak, bullseyes, score, shot_attempts')
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return { success: false, data: null, error };
    }

    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching leaderboard:', error);
    return { success: false, data: null, error };
  }
};