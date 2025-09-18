import { useState, useCallback } from 'react';

export interface RippleAnimation {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export interface PulseAnimation {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  startTime: number;
}

export interface GridSizeAnimation {
  isAnimating: boolean;
  startSize: number;
  targetSize: number;
  startTime: number;
  duration: number;
}

export interface AnimationState {
  rippleAnimation: RippleAnimation | null;
  pulseAnimation: PulseAnimation | null;
  gridSizeAnimation: GridSizeAnimation | null;
}

export interface AnimationActions {
  setRippleAnimation: (animation: RippleAnimation | null) => void;
  setPulseAnimation: (animation: PulseAnimation | null) => void;
  setGridSizeAnimation: (animation: GridSizeAnimation | null) => void;
  triggerRipple: (x: number, y: number, duration?: number) => void;
  triggerPulse: (x: number, y: number) => void;
  startGridSizeTransition: (currentSize: number, targetSize: number, duration?: number) => void;
  getCurrentGridSize: (cellSize: number, gridCells: number) => number;
}

export function useAnimations() {
  const [rippleAnimation, setRippleAnimation] = useState<RippleAnimation | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState<PulseAnimation | null>(null);
  const [gridSizeAnimation, setGridSizeAnimation] = useState<GridSizeAnimation | null>(null);

  // Trigger ripple effect
  const triggerRipple = useCallback((x: number, y: number, duration: number = 800) => {
    setRippleAnimation({
      x,
      y,
      startTime: Date.now(),
      duration
    });
  }, []);

  // Trigger pulse effect
  const triggerPulse = useCallback((x: number, y: number) => {
    setPulseAnimation({
      x,
      y,
      radius: 0,
      opacity: 1,
      startTime: Date.now()
    });
  }, []);

  // Start smooth grid size transition
  const startGridSizeTransition = useCallback((
    currentSize: number, 
    targetSize: number, 
    duration: number = 800
  ) => {
    setGridSizeAnimation({
      isAnimating: true,
      startSize: currentSize,
      targetSize: targetSize,
      startTime: Date.now(),
      duration
    });
  }, []);

  // Calculate current grid size with smooth animation
  const getCurrentGridSize = useCallback((cellSize: number, gridCells: number): number => {
    if (gridSizeAnimation && gridSizeAnimation.isAnimating) {
      const elapsed = Date.now() - gridSizeAnimation.startTime;
      const progress = Math.min(elapsed / gridSizeAnimation.duration, 1);
      
      // Ease-out function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentSize = gridSizeAnimation.startSize + 
        (gridSizeAnimation.targetSize - gridSizeAnimation.startSize) * easeOut;
      
      // If animation is complete, clean up
      if (progress >= 1) {
        setGridSizeAnimation(null);
      }
      
      return currentSize;
    }
    return cellSize * gridCells;
  }, [gridSizeAnimation]);

  const animationState: AnimationState = {
    rippleAnimation,
    pulseAnimation,
    gridSizeAnimation
  };

  const actions: AnimationActions = {
    setRippleAnimation,
    setPulseAnimation,
    setGridSizeAnimation,
    triggerRipple,
    triggerPulse,
    startGridSizeTransition,
    getCurrentGridSize
  };

  return { animationState, actions };
}
