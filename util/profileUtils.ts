import { supabase } from './supabase';

export const updateGameData = async (userId: string, gameData: {
  level?: number;
  accuracy?: number;
  streak?: number;
  bullseyes?: number;
  score?: number;
  shot_attempts?: number;
}) => {
  try {
    console.log('Calling RPC with data:', {
      p_user_id: userId,
      p_level: gameData.level,
      p_accuracy: gameData.accuracy,
      p_streak: gameData.streak,
      p_bullseyes: gameData.bullseyes,
      p_score: gameData.score,
      p_shot_attempts: gameData.shot_attempts,
    });
    
    const { data, error } = await supabase.rpc("update_game_data", {
      p_user_id: userId,
      p_level: gameData.level,
      p_accuracy: gameData.accuracy,
      p_streak: gameData.streak,
      p_bullseyes: gameData.bullseyes,
      p_score: gameData.score,
      p_shot_attempts: gameData.shot_attempts,
    });

    if (error) {
      console.error('Error updating game data via RPC:', error);
      
      // Fallback to direct table update if RPC fails
      console.log('Attempting direct table update as fallback...');
      const { data: directData, error: directError } = await supabase
        .from('profiles')
        .update({
          level: gameData.level,
          accuracy: gameData.accuracy,
          streak: gameData.streak,
          bullseyes: gameData.bullseyes,
          score: gameData.score,
          shot_attempts: gameData.shot_attempts,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (directError) {
        console.error('Direct table update also failed:', directError);
        return { success: false, error: directError, data: null };
      }

      console.log("Updated profile via direct update:", directData);
      return { success: true, data: directData };
    }

    console.log("Updated profile via RPC:", data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Unexpected error updating game data:', error);
    return { success: false, error, data: null };
  }
};
