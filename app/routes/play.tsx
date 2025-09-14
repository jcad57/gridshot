import { useRef, useEffect, useState, useCallback, useRef as useReactRef } from "react";
import { supabase } from "../../util/supabase";
import { updateUserProfile, incrementBullseyes, updateHighestStreak, updateLevel, updateGameData } from "../../util/profileUtils";
import type { Session } from "@supabase/supabase-js";
import FloatingGameInfoBar from "../../src/components/play/FloatingGameInfoBar";
import TargetDisplay from "../../src/components/play/TargetDisplay";
import DeveloperMenu from "../../src/components/play/DeveloperMenu";
import PowerupsContainer from "../../src/components/play/PowerupsContainer";
import ResultPopup from "../../src/components/play/ResultPopup";
import PlayerAvatar from "../../src/components/play/PlayerAvatar";
import ProfileModal from "../../src/components/play/ProfileModal";
import Tooltip from "../../src/components/play/Tooltip";
import GameCanvas from "../../src/components/play/GameCanvas";

// Helper to get a random coordinate for a given grid size (maxCoord)
function getRandomCoord(maxCoord: number) {
  // Range: 1 to maxCoord (inclusive)
  const x = Math.floor(Math.random() * maxCoord) + 1;
  const y = Math.floor(Math.random() * maxCoord) + 1;
  return { x, y };
}

function calculateScore(clicked: { x: number; y: number }, target: { x: number; y: number }) {
  // Euclidean distance
  const dx = clicked.x - target.x;
  const dy = clicked.y - target.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  // Score: 100 if perfect, 0 if distance >= 100, linear in between
  const score = Math.max(0, Math.round(100 - distance));
  return { distance, score };
}


export default function Play() {
  // --- Session state ---
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // --- Game statistics tracking ---
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [totalAccuracySum, setTotalAccuracySum] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [totalBullseyes, setTotalBullseyes] = useState<number>(0);

  // --- New state for grid size and attempt count ---
  const [maxCoord, setMaxCoord] = useState<number>(100); // coordinate max (100, 110, 120, ...)
  const [gridCells, setGridCells] = useState<number>(10); // number of cells (10, 11, 12, ...)
  const [level, setLevel] = useState<number>(1); // level starts at 1

  const [clickedCoord, setClickedCoord] = useState<{ x: number; y: number } | null>(null);
  const [randomCoord, setRandomCoord] = useState<{ x: number; y: number }>(() => getRandomCoord(100));
  const [score, setScore] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // New state for total score and fun message
  const [totalScore, setTotalScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>("");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  // For auto-advance timer cleanup
  const autoAdvanceTimeout = useReactRef<NodeJS.Timeout | null>(null);

  // --- New state to track if grid should grow after delay ---
  const [pendingGridGrow, setPendingGridGrow] = useState<boolean>(false);

  // --- New state: count of high-score (>=90) guesses since last grid grow ---
  const [highScoreStreak, setHighScoreStreak] = useState<number>(0);

  // --- New state for smooth grid size transition ---
  const [gridSizeAnimation, setGridSizeAnimation] = useState<{
    isAnimating: boolean;
    startSize: number;
    targetSize: number;
    startTime: number;
    duration: number;
  } | null>(null);


  // --- Ripple effect state ---
  const [rippleAnimation, setRippleAnimation] = useState<{
    x: number;
    y: number;
    startTime: number;
    duration: number;
  } | null>(null);

  // --- Canvas panning state ---
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isRecentering, setIsRecentering] = useState<boolean>(false);

  // --- Streak freeze feature ---
  const [streakFreeze, setStreakFreeze] = useState<boolean>(false);

  // --- Extra grid lines powerup ---
  const [hasExtraGridPowerup, setHasExtraGridPowerup] = useState<boolean>(false);
  const [hasExtraGridPlusPowerup, setHasExtraGridPlusPowerup] = useState<boolean>(false);
  const [hasExtraGridPlusPlusPowerup, setHasExtraGridPlusPlusPowerup] = useState<boolean>(false);
  const [showExtraGridLines, setShowExtraGridLines] = useState<boolean>(false);
  const [showExtraGridPlusLines, setShowExtraGridPlusLines] = useState<boolean>(false);
  const [showExtraGridPlusPlusLines, setShowExtraGridPlusPlusLines] = useState<boolean>(false);
  
  // --- Level jump powerup ---
  const [hasLevelJumpPowerup, setHasLevelJumpPowerup] = useState<boolean>(true);
  const [showLevelJumpGlow, setShowLevelJumpGlow] = useState<boolean>(false);
  const [shouldLevelJump, setShouldLevelJump] = useState<boolean>(false);

  // --- Target pulse powerup ---
  const [hasPulsePowerup, setHasPulsePowerup] = useState<boolean>(true);
  const [showPulseEffect, setShowPulseEffect] = useState<boolean>(false);
  const [pulseAnimation, setPulseAnimation] = useState<{ x: number; y: number; radius: number; opacity: number; startTime: number } | null>(null);

  // --- Homing powerup ---
  const [hasHomingPowerup, setHasHomingPowerup] = useState<boolean>(true);
  const [showHomingEffect, setShowHomingEffect] = useState<boolean>(false);



  // --- Tooltip state ---
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; title: string; description: string } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  
  // --- Mouse position for grid line highlighting ---
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isMouseInGrid, setIsMouseInGrid] = useState<boolean>(false);

  // --- Level up glow effect ---
  const [showLevelUpGlow, setShowLevelUpGlow] = useState<boolean>(false);

  // --- Get session and load initial stats on component mount ---
  useEffect(() => {
    const getSessionAndStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user?.id) {
          // Load initial stats from database
          const { data, error } = await supabase
            .from('profiles')
            .select('level, accuracy, streak, bullseyes, score')
            .eq('user_id', session.user.id)
            .single();

          if (!error && data) {
            // Initialize local state with database values
            setTotalAttempts(0); // Reset attempts for this session
            setTotalAccuracySum(0); // Reset accuracy sum for this session
            setCurrentStreak(0); // Reset current streak for this session
            setHighestStreak(data.streak || 0);
            setTotalBullseyes(data.bullseyes || 0);
            setTotalScore(data.score || 0);
            setLevel(data.level || 1); // Sync level with database
          } else {
            // If no profile exists, initialize with default values
            setTotalAttempts(0);
            setTotalAccuracySum(0);
            setCurrentStreak(0);
            setHighestStreak(0);
            setTotalBullseyes(0);
            setTotalScore(0);
            setLevel(1);
          }
        } else {
          // No session, initialize with default values
          setTotalAttempts(0);
          setTotalAccuracySum(0);
          setCurrentStreak(0);
          setHighestStreak(0);
          setTotalBullseyes(0);
          setTotalScore(0);
          setLevel(1);
        }
      } catch (error) {
        console.error('Error loading initial stats:', error);
        // Initialize with default values on error
        setTotalAttempts(0);
        setTotalAccuracySum(0);
        setCurrentStreak(0);
        setHighestStreak(0);
        setTotalBullseyes(0);
        setTotalScore(0);
        setLevel(1);
      } finally {
        // Always set loading to false when done
        setIsLoadingProfile(false);
      }
    };
    getSessionAndStats();
  }, []);

  // --- Profile update functions ---
  // Comprehensive game data update function (defined first)
  const updateComprehensiveGameData = useCallback(async (gameData: {
    level?: number;
    score?: number;
    accuracy?: number;
    streak?: number;
    bullseyes?: number;
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

    // Update attempt count and accuracy tracking
    setTotalAttempts(prev => {
      const newAttempts = prev + 1;
      setTotalAccuracySum(prevSum => {
        const newSum = prevSum + attemptScore;
        
        // Calculate current accuracy
        const currentAccuracy = newSum / newAttempts;
        
        // Update streak logic
        let newCurrentStreak = currentStreak;
        let newHighestStreak = highestStreak;
        let newTotalBullseyes = totalBullseyes;
        
        if (attemptScore >= 90) {
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
        if (attemptScore === 100) {
          newTotalBullseyes = totalBullseyes + 1;
          setTotalBullseyes(newTotalBullseyes);
        }
        
        // Update Supabase with all stats (use functional update to get latest totalScore)
        setTotalScore(currentTotalScore => {
          // Call updateComprehensiveGameData asynchronously
          updateComprehensiveGameData({
            level: level,
            score: currentTotalScore,
            accuracy: currentAccuracy,
            streak: newHighestStreak,
            bullseyes: newTotalBullseyes
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
          
          return currentTotalScore; // Return unchanged since we already updated it
        });
        
        return newSum;
      });
      return newAttempts;
    });
  }, [session, currentStreak, highestStreak, totalBullseyes, level, totalScore, updateComprehensiveGameData]);

  const updateProfileOnLevelUp = useCallback(async (newLevel: number) => {
    if (!session?.user?.id) return;
    
    try {
      // Use comprehensive update to sync all game data
      await updateComprehensiveGameData({ 
        level: newLevel,
        score: totalScore 
      });
      console.log('Level updated in profile:', newLevel);
    } catch (error) {
      console.error('Failed to update level:', error);
    }
  }, [session, totalScore, updateComprehensiveGameData]);

  // Update total score periodically
  const updateTotalScore = useCallback(async () => {
    if (!session?.user?.id || totalScore === 0) return;
    
    try {
      await updateComprehensiveGameData({ 
        score: totalScore 
      });
      console.log('Total score updated:', totalScore);
    } catch (error) {
      console.error('Failed to update total score:', error);
    }
  }, [session, totalScore, updateComprehensiveGameData]);


  // Update total score when it reaches milestones (every 1000 points)
  useEffect(() => {
    if (totalScore > 0 && totalScore % 1000 === 0) {
      updateTotalScore();
    }
  }, [totalScore, updateTotalScore]);

  // These constants must be accessible in both useEffect and the click handler
  const cellSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 40; // Smaller cells on mobile
  const axisOffset = typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 40; // Smaller offset on mobile
  
  // Calculate grid size with smooth animation
  const getCurrentGridSize = () => {
    if (gridSizeAnimation && gridSizeAnimation.isAnimating) {
      const elapsed = Date.now() - gridSizeAnimation.startTime;
      const progress = Math.min(elapsed / gridSizeAnimation.duration, 1);
      
      // Ease-out function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentSize = gridSizeAnimation.startSize + (gridSizeAnimation.targetSize - gridSizeAnimation.startSize) * easeOut;
      
      // If animation is complete, clean up
      if (progress >= 1) {
        setGridSizeAnimation(null);
      }
      
      return currentSize;
    }
    return cellSize * gridCells;
  };
  
  const gridSize = getCurrentGridSize();
  const gridWidth = axisOffset + gridSize + axisOffset;
  const gridHeight = axisOffset + gridSize + axisOffset;
  
  // Canvas fills the entire viewport
  const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const canvasHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

  // Track if the user has made a guess
  const hasGuessed = clickedCoord !== null;

  // Function to smoothly recenter the grid
  const smoothRecenter = useCallback(() => {
    if (isRecentering) return; // Prevent multiple animations
    
    setIsRecentering(true);
    const startOffset = { ...panOffset };
    const targetOffset = { x: 0, y: 0 };
    const duration = 500; // 500ms animation
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const newX = startOffset.x + (targetOffset.x - startOffset.x) * easeOut;
      const newY = startOffset.y + (targetOffset.y - startOffset.y) * easeOut;
      
      setPanOffset({ x: newX, y: newY });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsRecentering(false);
      }
    };
    
    requestAnimationFrame(animate);
  }, [panOffset, isRecentering]);

  // Function to start smooth grid size transition
  const startGridSizeTransition = useCallback((newGridCells: number) => {
    const currentSize = cellSize * gridCells;
    const targetSize = cellSize * newGridCells;
    
    setGridSizeAnimation({
      isAnimating: true,
      startSize: currentSize,
      targetSize: targetSize,
      startTime: Date.now(),
      duration: 800 // 800ms smooth transition
    });
  }, [cellSize, gridCells]);

  // --- Effect to update grid size after 3 high-score (>=90) guesses, but only after delay ---
  useEffect(() => {
    // If pendingGridGrow is set, grow the grid now
    if (pendingGridGrow) {
      setMaxCoord((prev) => prev + 10);
      setGridCells((prev) => prev + 1);
      setLevel((prev) => {
        const newLevel = prev + 1;
        updateProfileOnLevelUp(newLevel);
        return newLevel;
      }); // Increment level when grid grows
      setRandomCoord(getRandomCoord(maxCoord + 10));
      setClickedCoord(null);
      setScore(null);
      setDistance(null);
      setShowResult(false);
      setResultMessage("");
      setIsWaiting(false);
      setPendingGridGrow(false);
      setHighScoreStreak(0); // Reset streak after grid grows
      setStreakFreeze(false); // Reset freeze after grid grows
      setShowLevelUpGlow(false); // Reset glow after grid grows
      setShowExtraGridLines(false); // Reset extra grid lines after level up
      setShowExtraGridPlusLines(false); // Reset extra grid plus lines after level up
      setShowExtraGridPlusPlusLines(false); // Reset extra grid plus plus lines after level up
      setHasExtraGridPowerup(false); // Consume extra grid powerup after level up
      setHasExtraGridPlusPowerup(false); // Consume extra grid plus powerup after level up
      setHasExtraGridPlusPlusPowerup(false); // Consume extra grid plus plus powerup after level up
      // Start smooth grid size transition
      startGridSizeTransition(gridCells + 1);
      // Smoothly recenter the grid on the screen for level up
      smoothRecenter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingGridGrow, smoothRecenter, startGridSizeTransition]);



  // --- Effect to handle window resize for responsive grid sizing ---
  useEffect(() => {
    const handleResize = () => {
      // Force re-render when window size changes to update cellSize and axisOffset
      setPanOffset(prev => ({ ...prev }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Mouse event handlers for panning and clicking
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isSpacePressed) {
        // Start dragging for panning
        setIsDragging(true);
        setDragStart({ x: mouseX, y: mouseY });
      } else if (!isWaiting) {
        // Calculate grid position
        const gridX = (canvasWidth - gridWidth) / 2 + panOffset.x;
        const gridY = (canvasHeight - gridHeight) / 2 + panOffset.y;
        
        // Convert to grid-relative coordinates
        const gridRelativeX = mouseX - gridX;
        const gridRelativeY = mouseY - gridY;

      // Check if inside grid area
      if (
          gridRelativeX >= axisOffset &&
          gridRelativeX <= axisOffset + gridSize &&
          gridRelativeY >= axisOffset &&
          gridRelativeY <= axisOffset + gridSize
        ) {
          // Trigger ripple effect at click location (in canvas coordinates)
          setRippleAnimation({
            x: mouseX,
            y: mouseY,
            startTime: Date.now(),
            duration: 800, // 800ms animation
          });



        // Convert to grid coordinates (0-maxCoord, step 1)
          const x = Math.round(((gridRelativeX - axisOffset) / gridSize) * maxCoord);
          const y = Math.round(((gridSize - (gridRelativeY - axisOffset)) / gridSize) * maxCoord);
        const clicked = { x, y };
        setClickedCoord(clicked);

        // Calculate score and show result immediately
        if (randomCoord) {
          const { distance, score } = calculateScore(clicked, randomCoord);

          // Fun message
          let msg = "";
          if (score === 100) {
            msg = "🎯 Bullseye! You nailed it!";
          } else if (score >= 90) {
            msg = "🔥 So close! You're a gridshot pro!";
          } else if (score >= 70) {
            msg = "👍 Great shot! Just a bit off.";
          } else if (score >= 40) {
            msg = "😅 Not bad! Try to get closer next time.";
          } else if (score > 0) {
            msg = "🧐 Oof! That was a tough one. Keep trying!";
          } else {
            msg = "💥 Way off! But don't give up!";
          }

          setScore(score);
          setDistance(distance);

          // Update total score first
          setTotalScore((prev) => prev + score);

          // Update all game statistics
          updateGameStats(score);
            
            // Check if this score will trigger level up (3rd consecutive 90+ score)
            const willLevelUp = score >= 90 && (highScoreStreak + 1) % 3 === 0;
            
            // Check if level jump powerup was active and score is 97+
            if (showLevelJumpGlow && score >= 97) {
              // Add level jump message to the result
              const levelJumpMsg = "🚀 Level Jump activated! You're advancing to the next level!";
              setResultMessage(msg + "\n\n" + levelJumpMsg);
            } else if (willLevelUp) {
              // Add level advancement message to the result
              const levelAdvanceMsg = `🎉 Advanced to level ${level + 1}!`;
              setResultMessage(msg + "\n\n" + levelAdvanceMsg);
            } else {
          setResultMessage(msg);
            }
            
          setShowResult(true);
          setIsWaiting(true);


            // Handle level jump powerup activation
            if (showLevelJumpGlow) {
              if (score >= 97) {
                // Mark that level jump should happen after results are shown
                setShowLevelJumpGlow(false); // Turn off glow
                setHasLevelJumpPowerup(false); // Consume powerup
                setShouldLevelJump(true); // Mark for level jump after results
              } else {
                // Consume powerup even if score is not high enough
                setShowLevelJumpGlow(false); // Turn off glow
                setHasLevelJumpPowerup(false); // Consume powerup
              }
            }

            // Handle streak freeze activation and streak logic
            if (score >= 95) {
              // Activate freeze for next turn
              setStreakFreeze(true);
            }

            // Award extra grid lines powerup for 90+ score
            if (score >= 90) {
              setHasExtraGridPowerup(true);
            }

            // Consume homing powerup when turn ends
            setShowHomingEffect(false);



            // If score >= 90, increment highScoreStreak, else check freeze protection
            setHighScoreStreak((prevStreak) => {
              if (score >= 90) {
                const newStreak = prevStreak + 1;
                // Check if this will trigger level up (3rd consecutive 90+ score)
                if (newStreak > 0 && newStreak % 3 === 0) {
                  setShowLevelUpGlow(true);
                }
                // Streak is now handled in updateGameStats
                return newStreak;
            } else {
                // Check if freeze is active to protect streak
                if (streakFreeze) {
                  // Consume the freeze protection but keep streak
                  setStreakFreeze(false);
                  return prevStreak; // Keep current streak
                } else {
                  return 0; // Reset streak if score < 90 and no freeze
                }
              }
            });
        } else {
          setScore(null);
          setDistance(null);
        }
        }
      }
    },
    [axisOffset, gridSize, maxCoord, randomCoord, isWaiting, isSpacePressed, canvasWidth, canvasHeight, gridWidth, gridHeight, panOffset]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Update mouse position for grid line highlighting
      setMousePosition({ x: mouseX, y: mouseY });

      // Check if mouse is inside grid area
      const gridX = (canvasWidth - gridWidth) / 2 + panOffset.x;
      const gridY = (canvasHeight - gridHeight) / 2 + panOffset.y;
      const gridRelativeX = mouseX - gridX;
      const gridRelativeY = mouseY - gridY;
      
      const isInsideGrid = 
        gridRelativeX >= axisOffset &&
        gridRelativeX <= axisOffset + gridSize &&
        gridRelativeY >= axisOffset &&
        gridRelativeY <= axisOffset + gridSize;
      
      setIsMouseInGrid(isInsideGrid);

      if (isDragging && dragStart && isSpacePressed) {
        const deltaX = mouseX - dragStart.x;
        const deltaY = mouseY - dragStart.y;

        setPanOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));

        setDragStart({ x: mouseX, y: mouseY });
      }
    },
    [isDragging, dragStart, isSpacePressed, canvasWidth, canvasHeight, gridWidth, gridHeight, panOffset, axisOffset, gridSize]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    setMousePosition(null);
    setIsMouseInGrid(false);
  }, []);

  // Touch event handlers for mobile panning and clicking
  const handleCanvasTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault(); // Prevent default touch behaviors like scrolling
      const canvas = e.currentTarget;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      
      // Use unscaled coordinates for consistency with mouse events
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      // On mobile, always allow panning (no spacebar requirement)
      setIsDragging(true);
      setDragStart({ x: touchX, y: touchY });
    },
    []
  );

  const handleCanvasTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault(); // Prevent default touch behaviors
      if (!isDragging || !dragStart) return;

      const canvas = e.currentTarget;
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      
      // Use unscaled coordinates for consistency with mouse events
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      const deltaX = touchX - dragStart.x;
      const deltaY = touchY - dragStart.y;

      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setDragStart({ x: touchX, y: touchY });
    },
    [isDragging, dragStart]
  );

  const handleCanvasTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      
      // If this was a short touch (tap), treat it as a click
      if (dragStart && !isWaiting) {
        const canvas = e.currentTarget;
        
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        
        // Use unscaled coordinates for grid calculation (same as mouse events)
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Check if it was a tap (minimal movement)
        const deltaX = Math.abs(touchX - dragStart.x);
        const deltaY = Math.abs(touchY - dragStart.y);
        const isTab = deltaX < 10 && deltaY < 10; // Less than 10px movement = tap
        
        if (isTab) {
          // Calculate grid position (accounting for pan offset)
          const gridX = (canvasWidth - gridWidth) / 2 + panOffset.x;
          const gridY = (canvasHeight - gridHeight) / 2 + panOffset.y;
          
          // Convert to grid-relative coordinates
          const gridRelativeX = touchX - gridX;
          const gridRelativeY = touchY - gridY;

          // Check if inside grid area
          if (
            gridRelativeX >= axisOffset &&
            gridRelativeX <= axisOffset + gridSize &&
            gridRelativeY >= axisOffset &&
            gridRelativeY <= axisOffset + gridSize
          ) {
            // Trigger ripple effect at tap location (in canvas coordinates)
            setRippleAnimation({
              x: touchX,
              y: touchY,
              startTime: Date.now(),
              duration: 600,
            });

            // Calculate clicked coordinate (convert from canvas to grid coordinates)
            const gridXCoord = gridRelativeX - axisOffset;
            const gridYCoord = gridRelativeY - axisOffset;
            
            const cellX = Math.floor(gridXCoord / cellSize) + 1;
            const cellY = maxCoord - Math.floor(gridYCoord / cellSize);
            const clicked = { x: cellX, y: cellY };

            setClickedCoord(clicked);
            setShowResult(true);
            setIsWaiting(true);


            if (randomCoord) {
              const { distance, score } = calculateScore(clicked, randomCoord);

              // Fun message
              let msg = "";
              if (score === 100) {
                msg = "🎯 Bullseye! You nailed it!";
              } else if (score >= 90) {
                msg = "🔥 So close! You're a gridshot pro!";
              } else if (score >= 70) {
                msg = "👍 Great shot! Just a bit off.";
              } else if (score >= 40) {
                msg = "📍 Getting warmer! Keep trying.";
      } else {
                msg = "🎯 Keep practicing! You'll get it.";
              }

              setScore(score);
              setDistance(distance);
              setResultMessage(msg);

              // Update total score first
              setTotalScore((prev) => prev + score);

              // Update all game statistics
              updateGameStats(score);

              // Handle streak freeze activation and streak logic
              if (score >= 95) {
                setStreakFreeze(true);
              }

              // Award extra grid lines powerup for 90+ score
              if (score >= 90) {
                setHasExtraGridPowerup(true);
              }

              // If score >= 90, increment highScoreStreak, else check freeze protection
              setHighScoreStreak((prevStreak) => {
                if (score >= 90) {
                  const newStreak = prevStreak + 1;
                  if (newStreak > 0 && newStreak % 3 === 0) {
                    setShowLevelUpGlow(true);
                  }
                  return newStreak;
                } else {
                  if (streakFreeze) {
                    setStreakFreeze(false);
                    return prevStreak;
                  } else {
                    return 0;
                  }
                }
              });
            }
          }
        }
      }
      
      setIsDragging(false);
      setDragStart(null);
    },
    [dragStart, isWaiting, canvasWidth, canvasHeight, gridWidth, gridHeight, panOffset, axisOffset, gridSize, cellSize, maxCoord, randomCoord, streakFreeze]
  );

  // Handler to regenerate random coordinate and reset score/click
  const handleRegenerate = useCallback(() => {
    setRandomCoord(getRandomCoord(maxCoord));
    setClickedCoord(null);
    setScore(null);
    setDistance(null);
    setShowResult(false);
    setResultMessage("");
    setIsWaiting(false);
    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = null;
    }
    
    // Random homing powerup activation (10% chance)
    const shouldActivateHoming = Math.random() < 0.1;
    setShowHomingEffect(shouldActivateHoming);
  }, [maxCoord]);

  // Handler for next round button - checks if grid should grow
  const handleNextRound = useCallback(() => {
    // Reset glow effect when proceeding to next round
    setShowLevelUpGlow(false);
    
    // Handle level jump if triggered
    if (shouldLevelJump) {
      setMaxCoord((prev) => prev + 10);
      setGridCells((prev) => prev + 1);
      setLevel((prev) => {
        const newLevel = prev + 1;
        updateProfileOnLevelUp(newLevel);
        return newLevel;
      });
      setRandomCoord(getRandomCoord(maxCoord + 10));
      setClickedCoord(null);
      setScore(null);
      setDistance(null);
      setShowResult(false);
      setResultMessage("");
      setIsWaiting(false);
      setHighScoreStreak(0); // Reset streak
      setStreakFreeze(false); // Reset freeze
      setShouldLevelJump(false); // Reset flag
      // Don't reset extra grid lines here - they should persist until grid expands
      startGridSizeTransition(gridCells + 1); // Start smooth grid size transition
      // Smoothly recenter the grid on the screen only for level up
      smoothRecenter();
      
      // Random homing powerup activation (10% chance)
      const shouldActivateHoming = Math.random() < 0.1;
      setShowHomingEffect(shouldActivateHoming);
      
      return;
    }
    
    // Check if we should grow the grid based on current streak
    const nextStreak = highScoreStreak;
    if (nextStreak > 0 && nextStreak % 3 === 0) {
      setPendingGridGrow(true);
    } else {
      handleRegenerate();
    }
  }, [highScoreStreak, handleRegenerate, shouldLevelJump, maxCoord, smoothRecenter, startGridSizeTransition]);

  // Handle extra grid lines powerup activation
  const handleActivateExtraGrid = useCallback(() => {
    if (hasExtraGridPowerup) {
      setShowExtraGridLines(prev => !prev); // Toggle the powerup
      // Don't consume the powerup yet - it will be consumed when grid expands
    }
  }, [hasExtraGridPowerup]);

  // Handle extra grid plus lines powerup activation
  const handleActivateExtraGridPlus = useCallback(() => {
    if (hasExtraGridPlusPowerup) {
      setShowExtraGridPlusLines(prev => !prev); // Toggle the powerup
      // Don't consume the powerup yet - it will be consumed when grid expands
    }
  }, [hasExtraGridPlusPowerup]);

  // Handle extra grid plus plus lines powerup activation
  const handleActivateExtraGridPlusPlus = useCallback(() => {
    if (hasExtraGridPlusPlusPowerup) {
      setShowExtraGridPlusPlusLines(prev => !prev); // Toggle the powerup
      // Don't consume the powerup yet - it will be consumed when grid expands
    }
  }, [hasExtraGridPlusPlusPowerup]);

  // Handle pulse powerup activation
  const handleActivatePulse = useCallback(() => {
    if (hasPulsePowerup) {
      if (showPulseEffect) {
        // If already active, deactivate it
        setShowPulseEffect(false);
        setPulseAnimation(null);
      } else {
        // Activate pulse effect
        setShowPulseEffect(true);
        
        // Start pulse animation at target location (using same coordinate system as target drawing)
        const targetX = (canvasWidth - gridWidth) / 2 + panOffset.x + axisOffset + (randomCoord.x / maxCoord) * gridSize;
        const targetY = (canvasHeight - gridHeight) / 2 + panOffset.y + axisOffset + gridSize - (randomCoord.y / maxCoord) * gridSize;
        
        setPulseAnimation({
          x: targetX,
          y: targetY,
          radius: 0,
          opacity: 1,
          startTime: Date.now()
        });
        
        // Consume the powerup after use
        setHasPulsePowerup(false);
      }
    }
  }, [hasPulsePowerup, showPulseEffect, canvasWidth, canvasHeight, gridWidth, gridHeight, panOffset, axisOffset, randomCoord, maxCoord, gridSize]);

  // Handle level jump powerup activation
  const handleActivateLevelJump = useCallback(() => {
    if (hasLevelJumpPowerup) {
      setShowLevelJumpGlow(prev => !prev); // Toggle the powerup
      // Don't consume the powerup yet - it will be consumed when the user scores 97+
    }
  }, [hasLevelJumpPowerup]);

  // --- Developer menu: manual grid size increase ---
  const handleDevGridGrow = useCallback(() => {
    setMaxCoord((prev) => prev + 10);
    setGridCells((prev) => prev + 1);
    setLevel((prev) => {
      const newLevel = prev + 1;
      updateProfileOnLevelUp(newLevel);
      return newLevel;
    }); // Increment level when grid grows
    setRandomCoord(getRandomCoord(maxCoord + 10));
    setClickedCoord(null);
    setScore(null);
    setDistance(null);
    setShowResult(false);
    setResultMessage("");
    setIsWaiting(false);
    setHighScoreStreak(0);
    setStreakFreeze(false); // Reset freeze in dev menu
    setShowLevelUpGlow(false); // Reset glow in dev menu
    setShowExtraGridLines(false); // Reset extra grid lines in dev menu
    setShowExtraGridPlusLines(false); // Reset extra grid plus lines in dev menu
    setShowExtraGridPlusPlusLines(false); // Reset extra grid plus plus lines in dev menu
    // Start smooth grid size transition
    startGridSizeTransition(gridCells + 1);
  }, [maxCoord]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout.current) {
        clearTimeout(autoAdvanceTimeout.current);
      }
    };
  }, []);

  // --- The main change: fix grid movement by reserving space for the result/info area below the grid ---


  // Show the grid grow message only after the grid has actually grown (i.e., just after pendingGridGrow triggers)
  // Instead of attempts, use highScoreStreak for grid grow message
  const showGridGrowMessage = highScoreStreak > 0 && highScoreStreak % 3 === 0 && !pendingGridGrow;

  // --- Developer menu toggle (hidden by default, show on keypress or always for now) ---
  // For simplicity, always show for now
  const [showDevMenu, setShowDevMenu] = useState<boolean>(false);

  // Keyboard event handling (dev menu toggle and spacebar detection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "D" && (e.ctrlKey || e.metaKey)) {
        setShowDevMenu((v) => !v);
      }
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsDragging(false);
        setDragStart(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle window resize to update canvas dimensions
  useEffect(() => {
    const handleResize = () => {
      // Force re-render by updating a state that triggers canvas redraw
      setPanOffset(prev => ({ ...prev }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle tooltip mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (tooltip?.show) {
        setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [tooltip?.show]);

  // Show loading screen while profile data is loading
  if (isLoadingProfile) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
            Gridshot
          </h1>
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-lg text-gray-600 dark:text-gray-400 font-medium">Loading game...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* CSS for shine animation */}
      <style>
        {`
          @keyframes shine {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}
      </style>
      
      {/* Static gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20" />
      
      {/* Target Display */}
      <TargetDisplay randomCoord={randomCoord} />
      
      
      {/* Fixed UI Elements */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="pointer-events-auto">
          <DeveloperMenu
            showDevMenu={showDevMenu}
            setShowDevMenu={setShowDevMenu}
            handleRegenerate={handleRegenerate}
            handleDevGridGrow={handleDevGridGrow}
            showExtraGridLines={showExtraGridLines}
            setShowExtraGridLines={setShowExtraGridLines}
            showExtraGridPlusLines={showExtraGridPlusLines}
            setShowExtraGridPlusLines={setShowExtraGridPlusLines}
            showExtraGridPlusPlusLines={showExtraGridPlusPlusLines}
            setShowExtraGridPlusPlusLines={setShowExtraGridPlusPlusLines}
            showHomingEffect={showHomingEffect}
            setShowHomingEffect={setShowHomingEffect}
            maxCoord={maxCoord}
          />
        </div>
      </div>

      {/* Game Canvas */}
      <GameCanvas
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        cellSize={cellSize}
        gridCells={gridCells}
        axisOffset={axisOffset}
        gridSize={gridSize}
        maxCoord={maxCoord}
        clickedCoord={clickedCoord}
        randomCoord={randomCoord}
        hasGuessed={hasGuessed}
        showExtraGridLines={showExtraGridLines}
        showExtraGridPlusLines={showExtraGridPlusLines}
        showExtraGridPlusPlusLines={showExtraGridPlusPlusLines}
        mousePosition={mousePosition}
        rippleAnimation={rippleAnimation}
        setRippleAnimation={setRippleAnimation}
        pulseAnimation={pulseAnimation}
        setPulseAnimation={setPulseAnimation}
        setShowPulseEffect={setShowPulseEffect}
        panOffset={panOffset}
        setPanOffset={setPanOffset}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        showLevelUpGlow={showLevelUpGlow}
        showLevelJumpGlow={showLevelJumpGlow}
        gridSizeAnimation={gridSizeAnimation}
        showHomingEffect={showHomingEffect}
        isSpacePressed={isSpacePressed}
        isDragging={isDragging}
        isWaiting={isWaiting}
        isMouseInGrid={isMouseInGrid}
        handleCanvasMouseDown={handleCanvasMouseDown}
        handleCanvasMouseMove={handleCanvasMouseMove}
        handleCanvasMouseUp={handleCanvasMouseUp}
        handleCanvasMouseLeave={handleCanvasMouseLeave}
        handleCanvasTouchStart={handleCanvasTouchStart}
        handleCanvasTouchMove={handleCanvasTouchMove}
        handleCanvasTouchEnd={handleCanvasTouchEnd}
      />
      
      {/* Result Popup */}
      <ResultPopup
        showResult={showResult}
        resultMessage={resultMessage}
        score={score}
        distance={distance}
        showGridGrowMessage={showGridGrowMessage}
        maxCoord={maxCoord}
        isWaiting={isWaiting}
        handleNextRound={handleNextRound}
      />
      
      {/* Floating game info bar */}
      <FloatingGameInfoBar
        totalScore={totalScore}
        highScoreStreak={highScoreStreak}
        level={level}
      />

      {/* Player Avatar */}
      <PlayerAvatar setShowProfileModal={setShowProfileModal} />

      {/* Powerups Container */}
      <PowerupsContainer
        streakFreeze={streakFreeze}
        showHomingEffect={showHomingEffect}
        hasExtraGridPowerup={hasExtraGridPowerup}
        showExtraGridLines={showExtraGridLines}
        handleActivateExtraGrid={handleActivateExtraGrid}
        hasExtraGridPlusPowerup={hasExtraGridPlusPowerup}
        showExtraGridPlusLines={showExtraGridPlusLines}
        handleActivateExtraGridPlus={handleActivateExtraGridPlus}
        hasExtraGridPlusPlusPowerup={hasExtraGridPlusPlusPowerup}
        showExtraGridPlusPlusLines={showExtraGridPlusPlusLines}
        handleActivateExtraGridPlusPlus={handleActivateExtraGridPlusPlus}
        hasPulsePowerup={hasPulsePowerup}
        showPulseEffect={showPulseEffect}
        handleActivatePulse={handleActivatePulse}
        hasLevelJumpPowerup={hasLevelJumpPowerup}
        showLevelJumpGlow={showLevelJumpGlow}
        handleActivateLevelJump={handleActivateLevelJump}
        setTooltip={setTooltip}
      />

      {/* Tooltip */}
      <Tooltip tooltip={tooltip} />

      {/* Profile Modal */}
      {session && (
        <ProfileModal 
          showProfileModal={showProfileModal} 
          setShowProfileModal={setShowProfileModal}
          userEmail={session.user.email}
        />
      )}
    </>
  );
}
