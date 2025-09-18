import { useCallback, useEffect } from 'react';
import { useGameState } from './useGameState';
import { usePowerups } from './usePowerups';
import { useCanvasInteractions } from './useCanvasInteractions';
import { useAnimations } from './useAnimations';
import { useProfile } from './useProfile';
import { getRandomCoord, calculateScore, getScoreMessage, isHighScore, qualifiesForStreakFreeze, qualifiesForLevelJump } from '../utils/gameUtils';
import type { Coordinate } from '../utils/gameUtils';

export function useGameLogic() {
  // Initialize profile and get initial random coordinate
  const { profileState, loadProfile } = useProfile();
  const initialRandomCoord = getRandomCoord(100);
  
  // Initialize all hooks
  const { gameState, actions: gameActions } = useGameState(profileState.session, initialRandomCoord);
  const { powerupState, actions: powerupActions } = usePowerups();
  const { animationState, actions: animationActions } = useAnimations();

  // Canvas dimensions
  const cellSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 40;
  const axisOffset = typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 40;
  const gridSize = animationActions.getCurrentGridSize(cellSize, gameState.gridCells);
  const gridWidth = axisOffset + gridSize + axisOffset;
  const gridHeight = axisOffset + gridSize + axisOffset;
  const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const canvasHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

  const canvasDimensions = {
    canvasWidth,
    canvasHeight,
    gridWidth,
    gridHeight,
    gridSize,
    axisOffset,
    maxCoord: gameState.maxCoord,
    cellSize
  };

  const { canvasState, actions: canvasActions } = useCanvasInteractions(canvasDimensions);

  // Handle grid click
  const handleGridClick = useCallback((coord: Coordinate) => {
    if (gameState.isWaiting) return;

    // Trigger ripple effect
    const gridX = (canvasWidth - gridWidth) / 2 + canvasState.panOffset.x;
    const gridY = (canvasHeight - gridHeight) / 2 + canvasState.panOffset.y;
    const rippleX = gridX + axisOffset + (coord.x / gameState.maxCoord) * gridSize;
    const rippleY = gridY + axisOffset + gridSize - (coord.y / gameState.maxCoord) * gridSize;
    animationActions.triggerRipple(rippleX, rippleY);

    // Set clicked coordinate
    gameActions.setClickedCoord(coord);

    // Calculate score
    const { distance, score } = calculateScore(coord, gameState.randomCoord);
    const message = getScoreMessage(score);

    // Handle score
    gameActions.handleScore(score, distance, message);

    // Handle powerups and special effects
    if (isHighScore(score)) {
      // Award extra grid lines powerup
      powerupActions.setHasExtraGridPowerup(true);
      
      // Update high score streak
      const newStreak = gameState.highScoreStreak + 1;
      gameActions.setHighScoreStreak(newStreak);
      
      // Check for level up (3rd consecutive 90+ score)
      if (newStreak > 0 && newStreak % 3 === 0) {
        gameActions.setShowLevelUpGlow(true);
      }
    } else {
      // Check if freeze is active to protect streak
      if (powerupState.streakFreeze) {
        powerupActions.consumeStreakFreeze();
        // Keep current streak
      } else {
        gameActions.resetHighScoreStreak();
      }
    }

    // Handle streak freeze activation
    if (qualifiesForStreakFreeze(score)) {
      powerupActions.activateStreakFreeze();
    }

    // Handle level jump powerup
    if (powerupState.showLevelJumpGlow && qualifiesForLevelJump(score)) {
      const levelJumpMsg = "🚀 Level Jump activated! You're advancing to the next level!";
      gameActions.setResultMessage(message + "\n\n" + levelJumpMsg);
      powerupActions.consumeLevelJump();
      powerupActions.setShouldLevelJump(true);
    } else if (gameState.highScoreStreak > 0 && gameState.highScoreStreak % 3 === 0) {
      const levelAdvanceMsg = `🎉 Advanced to level ${gameState.stats.level + 1}!`;
      gameActions.setResultMessage(message + "\n\n" + levelAdvanceMsg);
    }

    // Consume homing powerup when turn ends
    powerupActions.consumeHoming();
  }, [
    gameState.isWaiting,
    gameState.randomCoord,
    gameState.maxCoord,
    gameState.highScoreStreak,
    gameState.stats.level,
    powerupState.streakFreeze,
    powerupState.showLevelJumpGlow,
    canvasWidth,
    canvasHeight,
    gridWidth,
    gridHeight,
    canvasState.panOffset,
    axisOffset,
    gridSize,
    gameActions,
    powerupActions,
    animationActions
  ]);

  // Handle next round
  const handleNextRound = useCallback(() => {
    // Reset glow effect
    gameActions.setShowLevelUpGlow(false);
    
    // Handle level jump if triggered
    if (powerupState.shouldLevelJump) {
      gameActions.levelUp();
      powerupActions.setShouldLevelJump(false);
      powerupActions.resetAllPowerups();
      canvasActions.smoothRecenter();
      powerupActions.activateHoming();
      return;
    }
    
    // Check if we should grow the grid based on current streak
    if (gameState.highScoreStreak > 0 && gameState.highScoreStreak % 3 === 0) {
      gameActions.setPendingGridGrow(true);
    } else {
      // Regenerate random coordinate and reset round
      gameActions.setRandomCoord(getRandomCoord(gameState.maxCoord));
      gameActions.resetRound();
      powerupActions.activateHoming();
    }
  }, [
    gameState.highScoreStreak,
    gameState.maxCoord,
    powerupState.shouldLevelJump,
    gameActions,
    powerupActions,
    canvasActions
  ]);

  // Handle regenerate (for dev menu)
  const handleRegenerate = useCallback(() => {
    gameActions.setRandomCoord(getRandomCoord(gameState.maxCoord));
    gameActions.resetRound();
    powerupActions.activateHoming();
  }, [gameState.maxCoord, gameActions, powerupActions]);

  // Handle level up effect
  useEffect(() => {
    if (gameState.pendingGridGrow) {
      gameActions.levelUp();
      powerupActions.resetAllPowerups();
      animationActions.startGridSizeTransition(
        cellSize * gameState.gridCells,
        cellSize * (gameState.gridCells + 1)
      );
      canvasActions.smoothRecenter();
    }
  }, [gameState.pendingGridGrow, gameState.gridCells, cellSize, gameActions, powerupActions, animationActions, canvasActions]);

  // Handle pulse powerup consumption when animation completes
  useEffect(() => {
    if (powerupState.showPulseEffect && !powerupState.pulseAnimation) {
      // Animation completed, consume the powerup
      powerupActions.consumePulse();
    }
  }, [powerupState.showPulseEffect, powerupState.pulseAnimation, powerupActions]);

  // Handle pulse powerup activation
  const handleActivatePulse = useCallback(() => {
    if (powerupState.hasPulsePowerup) {
      const targetX = (canvasWidth - gridWidth) / 2 + canvasState.panOffset.x + axisOffset + (gameState.randomCoord.x / gameState.maxCoord) * gridSize;
      const targetY = (canvasHeight - gridHeight) / 2 + canvasState.panOffset.y + axisOffset + gridSize - (gameState.randomCoord.y / gameState.maxCoord) * gridSize;
      powerupActions.activatePulse(targetX, targetY);
    }
  }, [
    powerupState.hasPulsePowerup,
    gameState.randomCoord,
    gameState.maxCoord,
    canvasWidth,
    canvasHeight,
    gridWidth,
    gridHeight,
    canvasState.panOffset,
    axisOffset,
    gridSize,
    powerupActions
  ]);

  return {
    // State
    profileState,
    gameState,
    powerupState,
    canvasState,
    animationState,
    
    // Actions
    gameActions,
    powerupActions,
    canvasActions,
    animationActions,
    
    // Game logic
    handleGridClick,
    handleNextRound,
    handleRegenerate,
    handleActivatePulse,
    
    // Dimensions
    canvasDimensions: {
      ...canvasDimensions,
      gridSize: animationActions.getCurrentGridSize(cellSize, gameState.gridCells)
    }
  };
}
