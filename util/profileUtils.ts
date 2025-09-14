import { supabase } from './supabase';

export interface ProfileUpdate {
  level?: number;
  accuracy?: number;
  streak?: number;
  bullseyes?: number;
  score?: number;
}

export const updateUserProfile = async (userId: string, updates: ProfileUpdate) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return { success: false, error };
  }
};

export const incrementBullseyes = async (userId: string) => {
  try {
    const { error } = await supabase.rpc('increment_bullseyes', {
      user_id: userId
    });

    if (error) {
      console.error('Error incrementing bullseyes:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error incrementing bullseyes:', error);
    return { success: false, error };
  }
};

export const updateHighestStreak = async (userId: string, newStreak: number) => {
  try {
    const { error } = await supabase.rpc('update_highest_streak', {
      user_id: userId,
      new_streak: newStreak
    });

    if (error) {
      console.error('Error updating highest streak:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating highest streak:', error);
    return { success: false, error };
  }
};

export const updateLevel = async (userId: string, newLevel: number) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ level: newLevel })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating level:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating level:', error);
    return { success: false, error };
  }
};

export const updateGameData = async (userId: string, gameData: {
  level?: number;
  accuracy?: number;
  streak?: number;
  bullseyes?: number;
  score?: number;
}) => {
  try {
    console.log('Calling RPC with data:', {
      p_user_id: userId,
      p_level: gameData.level,
      p_accuracy: gameData.accuracy,
      p_streak: gameData.streak,
      p_bullseyes: gameData.bullseyes,
      p_score: gameData.score,
    });
    
    const { data, error } = await supabase.rpc("update_game_data", {
      p_user_id: userId,
      p_level: gameData.level,
      p_accuracy: gameData.accuracy,
      p_streak: gameData.streak,
      p_bullseyes: gameData.bullseyes,
      p_score: gameData.score,
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
