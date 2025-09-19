import { useState, useCallback, useEffect } from 'react';
import { updateGameData } from '../../util/profileUtils';
import type { Session } from '@supabase/supabase-js';
import { isHighScore, isBullseye } from '../utils/gameUtils';
import type { ProfileData } from './useProfile';

export interface GameStats {
  totalAttempts: number;
  currentStreak: number;
  highestStreak: number;
  totalBullseyes: number;
  totalScore: number;
  level: number;
}

export interface GameState {
  stats: GameStats;
  maxCoord: number;
  gridCells: number;
  clickedCoord: { x: number; y: number } | null;
  randomCoord: { x: number; y: number };
  score: number | null;
  distance: number | null;
  showResult: boolean;
  resultMessage: string;
  isWaiting: boolean;
  highScoreStreak: number;
  hits: number;
  pendingGridGrow: boolean;
  showLevelUpGlow: boolean;
}

export interface GameActions {
  updateGameStats: (attemptScore: number) => Promise<void>;
  handleScore: (score: number, distance: number, message: string) => void;
  resetRound: () => void;
  setRandomCoord: (coord: { x: number; y: number }) => void;
  setClickedCoord: (coord: { x: number; y: number } | null) => void;
  setShowResult: (show: boolean) => void;
  setResultMessage: (message: string) => void;
  setIsWaiting: (waiting: boolean) => void;
  setHighScoreStreak: (streak: number) => void;
  setHits: (hits: number) => void;
  setPendingGridGrow: (pending: boolean) => void;
  setShowLevelUpGlow: (show: boolean) => void;
  levelUp: () => void;
  resetHighScoreStreak: () => void;
}

export function useGameState(session: Session | null, initialRandomCoord: { x: number; y: number }, profileData: ProfileData | null) {
  // Game statistics tracking - initialize from profile data if available
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(profileData?.streak || 0);
  const [totalBullseyes, setTotalBullseyes] = useState<number>(profileData?.bullseyes || 0);
  const [totalScore, setTotalScore] = useState<number>(profileData?.score || 0);
  const [level, setLevel] = useState<number>(profileData?.level || 1);

  // Grid and game state
  const [maxCoord, setMaxCoord] = useState<number>(100);
  const [gridCells, setGridCells] = useState<number>(10);
  const [clickedCoord, setClickedCoord] = useState<{ x: number; y: number } | null>(null);
  const [randomCoord, setRandomCoord] = useState<{ x: number; y: number }>(initialRandomCoord);
  const [score, setScore] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [highScoreStreak, setHighScoreStreak] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [pendingGridGrow, setPendingGridGrow] = useState<boolean>(false);
  const [showLevelUpGlow, setShowLevelUpGlow] = useState<boolean>(false);

  // Comprehensive game data update function
  const updateComprehensiveGameData = useCallback(async (gameData: {
    level?: number;
    score?: number;
    accuracy?: number;
    streak?: number;
    bullseyes?: number;
    shot_attempts?: number;
  }) => {
    if (!session?.user?.id) {
      console.log('No session found, skipping database update');
      return;
    }
    
    console.log('Updating comprehensive game data:', gameData);
    
    try {
      const result = await updateGameData(session.user.id, gameData);
      if (result.success) {
        console.log('Comprehensive game data updated successfully:', result.data);
      } else {
        console.error('Failed to update game data:', result.error);
      }
    } catch (error) {
      console.error('Failed to update comprehensive game data:', error);
    }
  }, [session]);

  // Update all game statistics
  const updateGameStats = useCallback(async (attemptScore: number) => {
    if (!session?.user?.id) return;

    // Update attempt count
    setTotalAttempts(prev => {
      const newAttempts = prev + 1;
      
      // Update streak logic
      let newCurrentStreak = currentStreak;
      let newHighestStreak = highestStreak;
      let newTotalBullseyes = totalBullseyes;
      
      if (isHighScore(attemptScore)) {
        // Increase current streak
        newCurrentStreak = currentStreak + 1;
        setCurrentStreak(newCurrentStreak);
        
        // Update highest streak only if current streak is higher
        if (newCurrentStreak > highestStreak) {
          newHighestStreak = newCurrentStreak;
          setHighestStreak(newHighestStreak);
        }
      } else {
        // Reset current streak
        newCurrentStreak = 0;
        setCurrentStreak(0);
      }
      
      // Check for bullseye (exactly 100 points)
      if (isBullseye(attemptScore)) {
        newTotalBullseyes = totalBullseyes + 1;
        setTotalBullseyes(newTotalBullseyes);
      }
      
      // Update Supabase with all stats including shot_attempts
      setTotalScore(currentTotalScore => {
        // Calculate accuracy as average score per attempt
        const currentAccuracy = currentTotalScore / newAttempts;
        
        // Call updateComprehensiveGameData asynchronously
        updateComprehensiveGameData({
          level: level,
          score: currentTotalScore,
          accuracy: currentAccuracy,
          streak: newHighestStreak,
          bullseyes: newTotalBullseyes,
          shot_attempts: newAttempts
        }).catch(error => {
          console.error('Failed to update game stats:', error);
        });
        
        console.log('Game stats updated:', {
          level,
          score: currentTotalScore,
          accuracy: currentAccuracy,
          streak: newHighestStreak,
          bullseyes: newTotalBullseyes,
          attempts: newAttempts
        });
        
        return currentTotalScore;
      });
      
      return newAttempts;
    });
  }, [session, currentStreak, highestStreak, totalBullseyes, level, totalScore, updateComprehensiveGameData]);

  // Handle score calculation and result display
  const handleScore = useCallback((score: number, distance: number, message: string) => {
    setScore(score);
    setDistance(distance);
    setResultMessage(message);
    setShowResult(true);
    setIsWaiting(true);

    // Update total score
    setTotalScore(prev => prev + score);

    // Update game statistics
    updateGameStats(score);
  }, [updateGameStats]);

  // Reset round state
  const resetRound = useCallback(() => {
    setClickedCoord(null);
    setScore(null);
    setDistance(null);
    setShowResult(false);
    setResultMessage('');
    setIsWaiting(false);
  }, []);

  // Level up function
  const levelUp = useCallback(() => {
    setMaxCoord(prev => prev + 10);
    setGridCells(prev => prev + 1);
    setLevel(prev => {
      const newLevel = prev + 1;
      // Update profile with new level
      updateComprehensiveGameData({ 
        level: newLevel,
        score: totalScore 
      }).catch(error => {
        console.error('Failed to update level:', error);
      });
      return newLevel;
    });
    setRandomCoord({ x: Math.floor(Math.random() * (maxCoord + 10)) + 1, y: Math.floor(Math.random() * (maxCoord + 10)) + 1 });
    resetRound();
    setHighScoreStreak(0);
    setHits(0); // Reset hits counter on level up
    setPendingGridGrow(false);
    setShowLevelUpGlow(false);
  }, [maxCoord, totalScore, updateComprehensiveGameData, resetRound]);

  // Reset high score streak
  const resetHighScoreStreak = useCallback(() => {
    setHighScoreStreak(0);
  }, []);

  // Update game state when profile data changes
  useEffect(() => {
    if (profileData) {
      setHighestStreak(profileData.streak);
      setTotalBullseyes(profileData.bullseyes);
      setTotalScore(profileData.score);
      setLevel(profileData.level);
      // Calculate grid size based on level
      const calculatedGridCells = Math.min(10 + Math.floor((profileData.level - 1) / 3), 20);
      const calculatedMaxCoord = 100 + ((profileData.level - 1) * 10);
      setGridCells(calculatedGridCells);
      setMaxCoord(calculatedMaxCoord);
    }
  }, [profileData]);

  // Update total score when it reaches milestones (every 1000 points)
  useEffect(() => {
    if (totalScore > 0 && totalScore % 1000 === 0) {
      updateComprehensiveGameData({ score: totalScore });
    }
  }, [totalScore, updateComprehensiveGameData]);

  const stats: GameStats = {
    totalAttempts,
    currentStreak,
    highestStreak,
    totalBullseyes,
    totalScore,
    level
  };

  const gameState: GameState = {
    stats,
    maxCoord,
    gridCells,
    clickedCoord,
    randomCoord,
    score,
    distance,
    showResult,
    resultMessage,
    isWaiting,
    highScoreStreak,
    hits,
    pendingGridGrow,
    showLevelUpGlow
  };

  const actions: GameActions = {
    updateGameStats,
    handleScore,
    resetRound,
    setRandomCoord,
    setClickedCoord,
    setShowResult,
    setResultMessage,
    setIsWaiting,
    setHighScoreStreak,
    setHits,
    setPendingGridGrow,
    setShowLevelUpGlow,
    levelUp,
    resetHighScoreStreak
  };

  return { gameState, actions };
}
