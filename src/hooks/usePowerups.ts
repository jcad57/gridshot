import { useState, useCallback } from 'react';

export interface PowerupState {
  // Streak freeze
  streakFreeze: boolean;
  
  // Extra grid lines
  hasExtraGridPowerup: boolean;
  hasExtraGridPlusPowerup: boolean;
  hasExtraGridPlusPlusPowerup: boolean;
  showExtraGridLines: boolean;
  showExtraGridPlusLines: boolean;
  showExtraGridPlusPlusLines: boolean;
  
  // Level jump
  hasLevelJumpPowerup: boolean;
  showLevelJumpGlow: boolean;
  shouldLevelJump: boolean;
  
  // Target pulse
  hasPulsePowerup: boolean;
  showPulseEffect: boolean;
  pulseAnimation: {
    x: number;
    y: number;
    radius: number;
    opacity: number;
    startTime: number;
  } | null;
  
  // Homing
  hasHomingPowerup: boolean;
  showHomingEffect: boolean;
}

export interface PowerupActions {
  // Streak freeze
  setStreakFreeze: (freeze: boolean) => void;
  activateStreakFreeze: () => void;
  consumeStreakFreeze: () => void;
  
  // Extra grid lines
  setHasExtraGridPowerup: (has: boolean) => void;
  setShowExtraGridLines: (show: boolean | ((prev: boolean) => boolean)) => void;
  activateExtraGrid: () => void;
  consumeExtraGrid: () => void;
  
  setHasExtraGridPlusPowerup: (has: boolean) => void;
  setShowExtraGridPlusLines: (show: boolean | ((prev: boolean) => boolean)) => void;
  activateExtraGridPlus: () => void;
  consumeExtraGridPlus: () => void;
  
  setHasExtraGridPlusPlusPowerup: (has: boolean) => void;
  setShowExtraGridPlusPlusLines: (show: boolean | ((prev: boolean) => boolean)) => void;
  activateExtraGridPlusPlus: () => void;
  consumeExtraGridPlusPlus: () => void;
  
  // Level jump
  setHasLevelJumpPowerup: (has: boolean) => void;
  setShowLevelJumpGlow: (glow: boolean) => void;
  setShouldLevelJump: (jump: boolean) => void;
  activateLevelJump: () => void;
  consumeLevelJump: () => void;
  
  // Target pulse
  setHasPulsePowerup: (has: boolean) => void;
  setShowPulseEffect: (show: boolean) => void;
  setPulseAnimation: (animation: PowerupState['pulseAnimation']) => void;
  activatePulse: (targetX: number, targetY: number) => void;
  consumePulse: () => void;
  
  // Homing
  setHasHomingPowerup: (has: boolean) => void;
  setShowHomingEffect: (show: boolean | ((prev: boolean) => boolean)) => void;
  activateHoming: () => void;
  consumeHoming: () => void;
  
  // Reset all powerups
  resetAllPowerups: () => void;
}

export function usePowerups() {
  // Streak freeze
  const [streakFreeze, setStreakFreeze] = useState<boolean>(false);
  
  // Extra grid lines
  const [hasExtraGridPowerup, setHasExtraGridPowerup] = useState<boolean>(false);
  const [hasExtraGridPlusPowerup, setHasExtraGridPlusPowerup] = useState<boolean>(false);
  const [hasExtraGridPlusPlusPowerup, setHasExtraGridPlusPlusPowerup] = useState<boolean>(false);
  const [showExtraGridLines, setShowExtraGridLines] = useState<boolean>(false);
  const [showExtraGridPlusLines, setShowExtraGridPlusLines] = useState<boolean>(false);
  const [showExtraGridPlusPlusLines, setShowExtraGridPlusPlusLines] = useState<boolean>(false);
  
  // Level jump
  const [hasLevelJumpPowerup, setHasLevelJumpPowerup] = useState<boolean>(true);
  const [showLevelJumpGlow, setShowLevelJumpGlow] = useState<boolean>(false);
  const [shouldLevelJump, setShouldLevelJump] = useState<boolean>(false);
  
  // Target pulse
  const [hasPulsePowerup, setHasPulsePowerup] = useState<boolean>(true);
  const [showPulseEffect, setShowPulseEffect] = useState<boolean>(false);
  const [pulseAnimation, setPulseAnimation] = useState<{
    x: number;
    y: number;
    radius: number;
    opacity: number;
    startTime: number;
  } | null>(null);
  
  // Homing
  const [hasHomingPowerup, setHasHomingPowerup] = useState<boolean>(true);
  const [showHomingEffect, setShowHomingEffect] = useState<boolean>(false);

  // Streak freeze actions
  const activateStreakFreeze = useCallback(() => {
    setStreakFreeze(true);
  }, []);

  const consumeStreakFreeze = useCallback(() => {
    setStreakFreeze(false);
  }, []);

  // Extra grid actions
  const activateExtraGrid = useCallback(() => {
    if (hasExtraGridPowerup) {
      setShowExtraGridLines(prev => !prev);
    }
  }, [hasExtraGridPowerup]);

  const consumeExtraGrid = useCallback(() => {
    setHasExtraGridPowerup(false);
    setShowExtraGridLines(false);
  }, []);

  const activateExtraGridPlus = useCallback(() => {
    if (hasExtraGridPlusPowerup) {
      setShowExtraGridPlusLines(prev => !prev);
    }
  }, [hasExtraGridPlusPowerup]);

  const consumeExtraGridPlus = useCallback(() => {
    setHasExtraGridPlusPowerup(false);
    setShowExtraGridPlusLines(false);
  }, []);

  const activateExtraGridPlusPlus = useCallback(() => {
    if (hasExtraGridPlusPlusPowerup) {
      setShowExtraGridPlusPlusLines(prev => !prev);
    }
  }, [hasExtraGridPlusPlusPowerup]);

  const consumeExtraGridPlusPlus = useCallback(() => {
    setHasExtraGridPlusPlusPowerup(false);
    setShowExtraGridPlusPlusLines(false);
  }, []);

  // Level jump actions
  const activateLevelJump = useCallback(() => {
    if (hasLevelJumpPowerup) {
      setShowLevelJumpGlow(prev => !prev);
    }
  }, [hasLevelJumpPowerup]);

  const consumeLevelJump = useCallback(() => {
    setHasLevelJumpPowerup(false);
    setShowLevelJumpGlow(false);
    setShouldLevelJump(false);
  }, []);

  // Pulse actions
  const activatePulse = useCallback((targetX: number, targetY: number) => {
    if (hasPulsePowerup) {
      if (showPulseEffect) {
        setShowPulseEffect(false);
        setPulseAnimation(null);
      } else {
        setShowPulseEffect(true);
        setPulseAnimation({
          x: targetX,
          y: targetY,
          radius: 0,
          opacity: 1,
          startTime: Date.now()
        });
        // Don't consume the powerup immediately - let the animation complete first
      }
    }
  }, [hasPulsePowerup, showPulseEffect]);

  const consumePulse = useCallback(() => {
    setHasPulsePowerup(false);
    setShowPulseEffect(false);
    setPulseAnimation(null);
  }, []);

  // Homing actions
  const activateHoming = useCallback(() => {
    const shouldActivate = Math.random() < 0.1; // 10% chance
    setShowHomingEffect(shouldActivate);
  }, []);

  const consumeHoming = useCallback(() => {
    setShowHomingEffect(false);
  }, []);

  // Reset all powerups
  const resetAllPowerups = useCallback(() => {
    setStreakFreeze(false);
    setHasExtraGridPowerup(false);
    setShowExtraGridLines(false);
    setHasExtraGridPlusPowerup(false);
    setShowExtraGridPlusLines(false);
    setHasExtraGridPlusPlusPowerup(false);
    setShowExtraGridPlusPlusLines(false);
    setShowLevelJumpGlow(false);
    setShouldLevelJump(false);
    setShowPulseEffect(false);
    setPulseAnimation(null);
    setShowHomingEffect(false);
  }, []);

  const powerupState: PowerupState = {
    streakFreeze,
    hasExtraGridPowerup,
    hasExtraGridPlusPowerup,
    hasExtraGridPlusPlusPowerup,
    showExtraGridLines,
    showExtraGridPlusLines,
    showExtraGridPlusPlusLines,
    hasLevelJumpPowerup,
    showLevelJumpGlow,
    shouldLevelJump,
    hasPulsePowerup,
    showPulseEffect,
    pulseAnimation,
    hasHomingPowerup,
    showHomingEffect
  };

  const actions: PowerupActions = {
    setStreakFreeze,
    activateStreakFreeze,
    consumeStreakFreeze,
    setHasExtraGridPowerup,
    setShowExtraGridLines: (show) => {
      if (typeof show === 'function') {
        setShowExtraGridLines(show);
      } else {
        setShowExtraGridLines(show);
      }
    },
    activateExtraGrid,
    consumeExtraGrid,
    setHasExtraGridPlusPowerup,
    setShowExtraGridPlusLines: (show) => {
      if (typeof show === 'function') {
        setShowExtraGridPlusLines(show);
      } else {
        setShowExtraGridPlusLines(show);
      }
    },
    activateExtraGridPlus,
    consumeExtraGridPlus,
    setHasExtraGridPlusPlusPowerup,
    setShowExtraGridPlusPlusLines: (show) => {
      if (typeof show === 'function') {
        setShowExtraGridPlusPlusLines(show);
      } else {
        setShowExtraGridPlusPlusLines(show);
      }
    },
    activateExtraGridPlusPlus,
    consumeExtraGridPlusPlus,
    setHasLevelJumpPowerup,
    setShowLevelJumpGlow,
    setShouldLevelJump,
    activateLevelJump,
    consumeLevelJump,
    setHasPulsePowerup,
    setShowPulseEffect,
    setPulseAnimation,
    activatePulse,
    consumePulse,
    setHasHomingPowerup,
    setShowHomingEffect: (show) => {
      if (typeof show === 'function') {
        setShowHomingEffect(show);
      } else {
        setShowHomingEffect(show);
      }
    },
    activateHoming,
    consumeHoming,
    resetAllPowerups
  };

  return { powerupState, actions };
}
