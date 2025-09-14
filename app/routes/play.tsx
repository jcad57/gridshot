import { useRef, useEffect, useState, useCallback, useRef as useReactRef } from "react";

// Floating game info bar at the top of the page
interface FloatingGameInfoBarProps {
  totalScore: number;
  highScoreStreak: number;
  level: number;
}

function FloatingGameInfoBar({
  totalScore,
  highScoreStreak,
  level,
}: FloatingGameInfoBarProps) {
  return (
    <div
      className="fixed top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-50 pointer-events-none flex justify-center"
    >
      <div
        className="inline-flex flex-row items-center justify-between gap-4 sm:gap-6 px-3 py-3 sm:px-6 sm:py-4 bg-white/95 dark:bg-gray-950/95 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-sm pointer-events-auto max-w-full overflow-hidden"
        style={{
          fontSize: "0.9rem",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Level */}
        <div className="flex flex-col items-center gap-1 text-green-700 dark:text-green-300">
          <span className="text-xs font-semibold">Level</span>
          <span className="text-lg font-extrabold">{level}</span>
        </div>

        {/* Score - Middle */}
        <div className="flex flex-col items-center gap-1 text-purple-700 dark:text-purple-300">
          <span className="text-xs font-semibold">Score</span>
          <span className="text-xl font-extrabold">{totalScore}</span>
        </div>

        {/* Streak info */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-1 text-orange-700 dark:text-orange-300">
            <span className="text-xs font-semibold">Streak</span>
            <span className="text-lg font-extrabold">
              {highScoreStreak > 0 ? "🔥".repeat(Math.min(highScoreStreak, 3)) : "—"}
                </span>
              </div>

              </div>


      </div>
    </div>
  );
}

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      setLevel((prev) => prev + 1); // Increment level when grid grows
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Detect dark mode
    const isDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Colors matching home page (tailwind: bg-white/dark:bg-gray-950, text-black/dark:text-white, border-gray-200/dark:border-gray-700)
    const colors = {
      bg: isDark ? "#0f172a" : "#fff", // gray-950 or white
      border: isDark ? "#334155" : "#e5e7eb", // gray-700 or gray-200
      axis: isDark ? "#fff" : "#222", // white or black
      grid: isDark ? "#334155" : "#bbb", // gray-700 or light gray
      label: isDark ? "#fff" : "#222", // white or black
      number: isDark ? "#cbd5e1" : "#222", // gray-300 or black
      marker: "#ef4444", // red-500
      target: "#22c55e", // green-500
    };

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas and fill with dark background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill canvas with blue/purple radial gradient background for depth
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.max(canvas.width, canvas.height) * 0.8; // 80% of the larger dimension
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    if (isDark) {
      gradient.addColorStop(0, '#0f3460');    // Darker blue at center
      gradient.addColorStop(0.5, '#16213e');  // Medium blue
      gradient.addColorStop(1, '#1a1a2e');    // Dark blue/purple at edges
    } else {
      gradient.addColorStop(0, '#d1e7ff');    // Slightly darker light blue at center
      gradient.addColorStop(0.5, '#e8f2ff');  // Light blue
      gradient.addColorStop(1, '#f8f9ff');    // Very light blue at edges
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle dot texture pattern to the background
    const dotSize = 2;
    const dotSpacing = 20;
    const dotOpacity = 0.3;
    
    ctx.fillStyle = isDark ? `rgba(100, 100, 100, ${dotOpacity})` : `rgba(150, 150, 150, ${dotOpacity})`;
    
    for (let x = 0; x < canvas.width; x += dotSpacing) {
      for (let y = 0; y < canvas.height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Calculate grid position (centered in viewport + pan offset)
    const gridX = (canvasWidth - gridWidth) / 2 + panOffset.x;
    const gridY = (canvasHeight - gridHeight) / 2 + panOffset.y;

    // Save context and translate for panning
    ctx.save();
    ctx.translate(gridX, gridY);

    // Continue grid size animation if active
    if (gridSizeAnimation && gridSizeAnimation.isAnimating) {
      requestAnimationFrame(() => {
        // Trigger re-render to continue grid size animation
        setPanOffset(prev => ({ ...prev }));
      });
    }

    // Draw fire glow effect behind grid if level up is ready
    if (showLevelUpGlow) {
      const cornerRadius = 16;
      
      // Create pulsing and rotating animation effect
      const time = Date.now() * 0.003; // Slow pulsing
      const pulseIntensity = 0.7 + Math.sin(time) * 0.3; // Oscillate between 0.4 and 1.0
      
      // Create rotating effect
      const rotationTime = Date.now() * 0.002; // Rotation speed
      const rotationRadius = 15; // How far the glow moves in a circle
      const centerX = gridWidth / 2;
      const centerY = gridHeight / 2;
      const offsetX = Math.cos(rotationTime) * rotationRadius;
      const offsetY = Math.sin(rotationTime) * rotationRadius;
      
      // Draw multiple glowing layers for fire effect with rotation
      const glowLayers = [
        { color: `rgba(255, 69, 0, ${0.4 * pulseIntensity})`, blur: 60, size: 50 },   // Deep red outer glow (bigger)
        { color: `rgba(255, 140, 0, ${0.5 * pulseIntensity})`, blur: 40, size: 35 },  // Orange middle glow (bigger)
        { color: `rgba(255, 165, 0, ${0.6 * pulseIntensity})`, blur: 25, size: 20 },  // Light orange inner glow
        { color: `rgba(255, 215, 0, ${0.4 * pulseIntensity})`, blur: 15, size: 10 }   // Golden accent
      ];
      
      glowLayers.forEach((layer, index) => {
        ctx.shadowColor = layer.color;
        ctx.shadowBlur = layer.blur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = 'transparent';
        ctx.beginPath();
        
        // Apply rotation offset based on layer index for more dynamic effect
        const layerOffsetX = offsetX * (1 + index * 0.3);
        const layerOffsetY = offsetY * (1 + index * 0.3);
        
        ctx.roundRect(
          -layer.size + layerOffsetX, 
          -layer.size + layerOffsetY, 
          gridWidth + (layer.size * 2), 
          gridHeight + (layer.size * 2), 
          cornerRadius + layer.size
        );
        ctx.fill();
      });
      
      // Continue animation
      requestAnimationFrame(() => {
        // Trigger re-render to continue fire animation
        setPanOffset(prev => ({ ...prev }));
      });
    }

    // Draw blue/purple glow effect behind grid if level jump is active
    if (showLevelJumpGlow) {
      // Create pulsing animation effect
      const time = Date.now() * 0.004; // Slightly faster pulsing
      const pulseIntensity = 0.6 + Math.sin(time) * 0.4; // Oscillate between 0.2 and 1.0
      
      // Draw multiple glowing layers for blue/purple effect
      const glowLayers = [
        { color: `rgba(139, 92, 246, ${0.3 * pulseIntensity})`, blur: 40, size: 30 },   // Purple outer glow
        { color: `rgba(59, 130, 246, ${0.4 * pulseIntensity})`, blur: 25, size: 20 },   // Blue middle glow  
        { color: `rgba(147, 51, 234, ${0.5 * pulseIntensity})`, blur: 15, size: 10 },   // Deep purple inner glow
        { color: `rgba(99, 102, 241, ${0.3 * pulseIntensity})`, blur: 8, size: 5 }      // Indigo accent
      ];
      
      glowLayers.forEach(layer => {
        ctx.shadowColor = layer.color;
        ctx.shadowBlur = layer.blur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = 'transparent';
        ctx.beginPath();
        // Use standard rectangle instead of roundRect for better browser compatibility
        ctx.rect(-layer.size, -layer.size, gridWidth + (layer.size * 2), gridHeight + (layer.size * 2));
        ctx.fill();
      });
      
      // Continue animation
      requestAnimationFrame(() => {
        // Trigger re-render to continue level jump animation
        setPanOffset(prev => ({ ...prev }));
      });
    }

    // Draw grid background (solid color with rounded corners and normal shadow)
    ctx.fillStyle = colors.bg;
    ctx.shadowColor = showLevelUpGlow ? 'rgba(255, 100, 0, 0.4)' : showLevelJumpGlow ? 'rgba(139, 92, 246, 0.4)' : 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = showLevelUpGlow ? 30 : showLevelJumpGlow ? 30 : 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = showLevelUpGlow || showLevelJumpGlow ? 0 : 8;
    
    // Draw rounded rectangle for grid background
    const cornerRadius = 16;
    ctx.beginPath();
    ctx.roundRect(0, 0, gridWidth, gridHeight, cornerRadius);
    ctx.fill();
    
    // Draw the clickable grid area with hover effect
    const baseBgColor = colors.bg;
    // Create a 10% brighter blueish version of the base color for hover effect
    const hoverBgColor = isDark ? "#11203b" : "#f8fafc"; // 10% brighter blueish version
    ctx.fillStyle = isMouseInGrid ? hoverBgColor : baseBgColor;
    
    // Remove shadow for the inner area
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw the clickable area (the coordinate system area)
    ctx.beginPath();
    ctx.rect(axisOffset, axisOffset, gridSize, gridSize);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw axes
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 2;

    // X axis
    ctx.beginPath();
    ctx.moveTo(axisOffset, axisOffset + gridSize);
    ctx.lineTo(axisOffset + gridSize, axisOffset + gridSize);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(axisOffset, axisOffset + gridSize);
    ctx.lineTo(axisOffset, axisOffset);
    ctx.stroke();

    // Draw only the grid lines at the middle of the grid (x: mid, y: mid)
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    // Calculate the middle value for the grid lines
    // If maxCoord is even, it's maxCoord/2; if odd, it's (maxCoord+1)/2 (to keep it centered)
    // But for a grid from 0 to maxCoord, the true middle is maxCoord/2
    const midCoord = maxCoord / 2;

    // Vertical grid line at x = midCoord
    const xMid = axisOffset + (midCoord / maxCoord) * gridSize;
    ctx.beginPath();
    ctx.moveTo(xMid, axisOffset + gridSize);
    ctx.lineTo(xMid, axisOffset);
    ctx.stroke();

    // Horizontal grid line at y = midCoord
    const yMid = axisOffset + gridSize - (midCoord / maxCoord) * gridSize;
    ctx.beginPath();
    ctx.moveTo(axisOffset, yMid);
    ctx.lineTo(axisOffset + gridSize, yMid);
    ctx.stroke();

    // Draw additional grid lines if powerups are active
    if (showExtraGridLines || showExtraGridPlusLines || showExtraGridPlusPlusLines) {
      let evenlySpacedCoords: number[] = [];
      
      // Determine which powerup is active and set appropriate coordinates
      if (showExtraGridLines) {
        // Grid+: 2 extra lines (at 25%, 75%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.25,  // 25%
          maxCoord * 0.75   // 75%
        ];
      } else if (showExtraGridPlusLines) {
        // Grid++: 3 extra lines (at 25%, 50%, 75%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.25,  // 25%
          maxCoord * 0.5,   // 50%
          maxCoord * 0.75   // 75%
        ];
      } else if (showExtraGridPlusPlusLines) {
        // Grid+++: 8 extra lines (at 12.5%, 25%, 37.5%, 50%, 62.5%, 75%, 87.5%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.125, // 12.5%
          maxCoord * 0.25,  // 25%
          maxCoord * 0.375, // 37.5%
          maxCoord * 0.5,   // 50%
          maxCoord * 0.625, // 62.5%
          maxCoord * 0.75,  // 75%
          maxCoord * 0.875  // 87.5%
        ];
      }

      evenlySpacedCoords.forEach((coord) => {
        // Vertical lines
        const x = axisOffset + (coord / maxCoord) * gridSize;
        
        // Check if mouse is near this vertical line
        const isNearVertical = mousePosition && Math.abs(mousePosition.x - x) < 20;
        
        ctx.strokeStyle = isNearVertical ? '#60a5fa' : '#93c5fd'; // blue-400 if near, blue-300 if not
        ctx.lineWidth = isNearVertical ? 1.5 : 0.8;
        ctx.globalAlpha = isNearVertical ? 0.8 : 0.5;
        
        ctx.beginPath();
        ctx.moveTo(x, axisOffset + gridSize);
        ctx.lineTo(x, axisOffset);
        ctx.stroke();

        // Horizontal lines
        const y = axisOffset + gridSize - (coord / maxCoord) * gridSize;
        
        // Check if mouse is near this horizontal line
        const isNearHorizontal = mousePosition && Math.abs(mousePosition.y - y) < 20;
        
        ctx.strokeStyle = isNearHorizontal ? '#60a5fa' : '#93c5fd'; // blue-400 if near, blue-300 if not
        ctx.lineWidth = isNearHorizontal ? 1.5 : 0.8;
        ctx.globalAlpha = isNearHorizontal ? 0.8 : 0.5;
        
        ctx.beginPath();
        ctx.moveTo(axisOffset, y);
        ctx.lineTo(axisOffset + gridSize, y);
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
    }



    // Draw axis labels
    ctx.fillStyle = colors.label;
    ctx.font = `${typeof window !== 'undefined' && window.innerWidth < 768 ? "16px" : "20px"} Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("x", axisOffset + gridSize / 2, axisOffset + gridSize + 28);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("y", axisOffset - 30, axisOffset + gridSize / 2);

    // Draw numbers on axes: only 0, midCoord, maxCoord for both axes
    ctx.font = `${typeof window !== 'undefined' && window.innerWidth < 768 ? "14px" : "16px"} Inter, ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = colors.number;

    // X axis numbers
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    let xLabels = [0, midCoord, maxCoord];
    
    // Add more labels if powerup is active
    if (showExtraGridLines || showExtraGridPlusLines || showExtraGridPlusPlusLines) {
      let evenlySpacedCoords: number[] = [];
      
      if (showExtraGridLines) {
        // Grid+: 2 extra lines (at 25%, 75%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.25,  // 25%
          maxCoord * 0.75   // 75%
        ];
      } else if (showExtraGridPlusLines) {
        // Grid++: 3 extra lines (at 25%, 50%, 75%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.25,  // 25%
          maxCoord * 0.5,   // 50%
          maxCoord * 0.75   // 75%
        ];
      } else if (showExtraGridPlusPlusLines) {
        // Grid+++: 8 extra lines (at 12.5%, 25%, 37.5%, 50%, 62.5%, 75%, 87.5%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.125, // 12.5%
          maxCoord * 0.25,  // 25%
          maxCoord * 0.375, // 37.5%
          maxCoord * 0.5,   // 50%
          maxCoord * 0.625, // 62.5%
          maxCoord * 0.75,  // 75%
          maxCoord * 0.875  // 87.5%
        ];
      }
      
      xLabels = [...xLabels, ...evenlySpacedCoords].sort((a, b) => a - b);
    }
    
    xLabels.forEach((val) => {
      const x =
        axisOffset +
        (val / maxCoord) * gridSize;
      // Show integer if val is integer, else show one decimal
      const isMainLabel = val === 0 || val === midCoord || val === maxCoord;
      ctx.font = isMainLabel ? `${typeof window !== 'undefined' && window.innerWidth < 768 ? "14px" : "16px"} Inter, ui-sans-serif, system-ui, sans-serif` : `${typeof window !== 'undefined' && window.innerWidth < 768 ? "10px" : "12px"} Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.globalAlpha = isMainLabel ? 1 : 0.7;
      ctx.fillText(
        Number.isInteger(val) ? `${val}` : `${val.toFixed(1)}`,
        x,
        axisOffset + gridSize + 4
      );
    });
    ctx.globalAlpha = 1;

    // Y axis numbers
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    let yLabels = [0, midCoord, maxCoord];
    
    // Add more labels if powerup is active
    if (showExtraGridLines || showExtraGridPlusLines || showExtraGridPlusPlusLines) {
      let evenlySpacedCoords: number[] = [];
      
      if (showExtraGridLines) {
        // Grid+: 2 extra lines (at 25%, 75%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.25,  // 25%
          maxCoord * 0.75   // 75%
        ];
      } else if (showExtraGridPlusLines) {
        // Grid++: 3 extra lines (at 25%, 50%, 75%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.25,  // 25%
          maxCoord * 0.5,   // 50%
          maxCoord * 0.75   // 75%
        ];
      } else if (showExtraGridPlusPlusLines) {
        // Grid+++: 8 extra lines (at 12.5%, 25%, 37.5%, 50%, 62.5%, 75%, 87.5%) - evenly spaced between quadrants
        evenlySpacedCoords = [
          maxCoord * 0.125, // 12.5%
          maxCoord * 0.25,  // 25%
          maxCoord * 0.375, // 37.5%
          maxCoord * 0.5,   // 50%
          maxCoord * 0.625, // 62.5%
          maxCoord * 0.75,  // 75%
          maxCoord * 0.875  // 87.5%
        ];
      }
      
      yLabels = [...yLabels, ...evenlySpacedCoords].sort((a, b) => a - b);
    }
    
    yLabels.forEach((val) => {
      const y =
        axisOffset + gridSize - (val / maxCoord) * gridSize;
      const isMainLabel = val === 0 || val === midCoord || val === maxCoord;
      ctx.font = isMainLabel ? `${typeof window !== 'undefined' && window.innerWidth < 768 ? "14px" : "16px"} Inter, ui-sans-serif, system-ui, sans-serif` : `${typeof window !== 'undefined' && window.innerWidth < 768 ? "10px" : "12px"} Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.globalAlpha = isMainLabel ? 1 : 0.7;
      ctx.fillText(
        Number.isInteger(val) ? `${val}` : `${val.toFixed(1)}`,
        axisOffset - 4,
        y
      );
    });
    ctx.globalAlpha = 1;

    // Draw homing effect if active
    if (showHomingEffect && mousePosition && randomCoord && !hasGuessed) {
      const homingRadius = 30;
      
      // Convert mouse position to grid-relative coordinates
      const gridX = (canvasWidth - gridWidth) / 2 + panOffset.x;
      const gridY = (canvasHeight - gridHeight) / 2 + panOffset.y;
      const mouseGridX = mousePosition.x - gridX;
      const mouseGridY = mousePosition.y - gridY;
      
      // Calculate distance from mouse to target
      const targetCanvasX = axisOffset + (randomCoord.x / maxCoord) * gridSize;
      const targetCanvasY = axisOffset + gridSize - (randomCoord.y / maxCoord) * gridSize;
      
      const distance = Math.sqrt(
        Math.pow(mouseGridX - targetCanvasX, 2) + 
        Math.pow(mouseGridY - targetCanvasY, 2)
      );
      
      // Calculate color based on distance (closer = more green)
      const maxDistance = 200; // Maximum distance for color calculation
      const proximity = Math.max(0, 1 - (distance / maxDistance));
      
      // Interpolate from red (far) to green (close)
      const red = Math.floor(255 * (1 - proximity));
      const green = Math.floor(255 * proximity);
      const blue = 0;
      
      // Draw homing circle around cursor (in grid-relative coordinates)
      ctx.beginPath();
      ctx.arc(mouseGridX, mouseGridY, homingRadius, 0, 2 * Math.PI);
      
      // Fill circle with background color at 10% opacity
      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.1)`;
      ctx.fill();
      
      // Draw border with 80% opacity
      ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Only draw the random target coordinate as a green dot AFTER the user has guessed
    if (hasGuessed && randomCoord) {
      const targetCanvasX = axisOffset + (randomCoord.x / maxCoord) * gridSize;
      const targetCanvasY = axisOffset + gridSize - (randomCoord.y / maxCoord) * gridSize;
      ctx.beginPath();
      ctx.arc(targetCanvasX, targetCanvasY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = colors.target;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = `bold ${typeof window !== 'undefined' && window.innerWidth < 768 ? "10px" : "12px"} Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = colors.target;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("Target", targetCanvasX + 8, targetCanvasY - 2);

      // Also show the coordinate number at the target
      ctx.font = `bold ${typeof window !== 'undefined' && window.innerWidth < 768 ? "10px" : "12px"} Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = colors.target;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `(${randomCoord.x}, ${randomCoord.y})`,
        targetCanvasX + 8,
        targetCanvasY + 10
      );
    }

    // Draw the clicked coordinate as a red dot
    if (clickedCoord) {
      const clickCanvasX = axisOffset + (clickedCoord.x / maxCoord) * gridSize;
      const clickCanvasY = axisOffset + gridSize - (clickedCoord.y / maxCoord) * gridSize;
      ctx.beginPath();
      ctx.arc(clickCanvasX, clickCanvasY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = colors.marker;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = `bold ${typeof window !== 'undefined' && window.innerWidth < 768 ? "10px" : "12px"} Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = colors.marker;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("Your Click", clickCanvasX + 8, clickCanvasY + 2);

      // Also show the coordinate number at the click
      ctx.font = `bold ${typeof window !== 'undefined' && window.innerWidth < 768 ? "10px" : "12px"} Inter, ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = colors.marker;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `(${clickedCoord.x}, ${clickedCoord.y})`,
        clickCanvasX + 8,
        clickCanvasY + 16
      );
    }

    // Optionally, draw a line between the two (only after guess)
    if (hasGuessed && clickedCoord && randomCoord) {
      const clickCanvasX = axisOffset + (clickedCoord.x / maxCoord) * gridSize;
      const clickCanvasY = axisOffset + gridSize - (clickedCoord.y / maxCoord) * gridSize;
      const targetCanvasX = axisOffset + (randomCoord.x / maxCoord) * gridSize;
      const targetCanvasY = axisOffset + gridSize - (randomCoord.y / maxCoord) * gridSize;
      ctx.beginPath();
      ctx.moveTo(clickCanvasX, clickCanvasY);
      ctx.lineTo(targetCanvasX, targetCanvasY);
      ctx.strokeStyle = "#f59e42"; // orange-400
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Restore context after grid drawing
    ctx.restore();

    // Draw ripple effect if active (in canvas coordinates, not grid coordinates)
    if (rippleAnimation) {
      const currentTime = Date.now();
      const elapsed = currentTime - rippleAnimation.startTime;
      const progress = Math.min(elapsed / rippleAnimation.duration, 1);

      if (progress < 1) {
        // Calculate ripple properties
        const maxRadius = 60;
        const currentRadius = progress * maxRadius;
        const opacity = 1 - progress; // Fade out as it expands

        // Draw the ripple (ripple coordinates are already in canvas space)
        ctx.beginPath();
        ctx.arc(rippleAnimation.x, rippleAnimation.y, currentRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(34, 197, 94, ${opacity * 0.8})`; // Green with fading opacity
        ctx.lineWidth = 2;
        ctx.globalAlpha = opacity;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Continue animation
        requestAnimationFrame(() => {
          // Trigger re-render by updating a dummy state or forcing re-draw
          setRippleAnimation({ ...rippleAnimation });
        });
      } else {
        // Animation complete, clear ripple
        setRippleAnimation(null);
      }
    }

    // Draw pulse effect if active
    if (pulseAnimation) {
      const currentTime = Date.now();
      const elapsed = currentTime - pulseAnimation.startTime;
      const progress = Math.min(elapsed / 2000, 1); // 2 second animation

      if (progress < 1) {
        // Calculate pulse properties
        const maxRadius = 120;
        const currentRadius = progress * maxRadius;
        const opacity = (1 - progress) * 0.8; // Fade out as it expands

        // Draw single pulse ring
        ctx.beginPath();
        ctx.arc(pulseAnimation.x, pulseAnimation.y, currentRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`; // Blue pulse
        ctx.lineWidth = 4; // Increased line width for better visibility
        ctx.globalAlpha = opacity;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Continue animation
        requestAnimationFrame(() => {
          // Trigger re-render by updating pulse animation
          setPulseAnimation({ ...pulseAnimation });
        });
      } else {
        // Animation complete, clear pulse
        setPulseAnimation(null);
        setShowPulseEffect(false);
      }
    }
  }, [
    canvasWidth,
    canvasHeight,
    cellSize,
    gridCells,
    axisOffset,
    gridSize,
    clickedCoord,
    randomCoord,
    hasGuessed,
    maxCoord,
    showExtraGridLines,
    showExtraGridPlusLines,
    showExtraGridPlusPlusLines,
    mousePosition,
    rippleAnimation,
    pulseAnimation,
    panOffset,
    gridWidth,
    gridHeight,
    showLevelUpGlow,
    showLevelJumpGlow,
    gridSizeAnimation,
  ]);

  // Mouse event handlers for panning and clicking
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
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
          setTotalScore((prev) => prev + score);
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
      const canvas = canvasRef.current;
      if (!canvas) return;
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
      const canvas = canvasRef.current;
      if (!canvas) return;
      
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

      const canvas = canvasRef.current;
      if (!canvas) return;
      
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
        const canvas = canvasRef.current;
        if (!canvas) return;
        
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
              setTotalScore((prev) => prev + score);

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
      setLevel((prev) => prev + 1);
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
    setLevel((prev) => prev + 1); // Increment level when grid grows
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
      
      {/* Target Display - Bottom of Page */}
      <div className="fixed bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-50 pointer-events-none flex justify-center">
        <div className="bg-white/80 dark:bg-gray-950/80 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-sm pointer-events-auto px-4 py-3 sm:px-6 sm:py-4"
          style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">Your target:</span>
            <span className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400">({randomCoord.x}, {randomCoord.y})</span>
          </div>
        </div>
      </div>
      
      {/* Fixed UI Elements */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="pointer-events-auto">
          {/* Developer Menu - Left Side */}
          <div className="fixed top-20 left-4 sm:top-24 flex flex-col items-start gap-2">
          <button
              className="text-xs px-3 py-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700 transition shadow-sm"
            onClick={() => setShowDevMenu((v) => !v)}
            type="button"
            aria-label="Toggle developer menu"
          >
            {showDevMenu ? "Hide Dev Menu" : "Show Dev Menu"}
          </button>
            
        {showDevMenu && (
              <div className="px-3 py-2 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700 text-xs flex flex-col items-stretch gap-2 shadow-lg min-w-max">
                <span className="font-bold text-center">Developer Menu</span>
                <button
                  className="px-2 py-1 rounded bg-green-500 hover:bg-green-700 text-white font-semibold text-xs transition"
                  onClick={handleRegenerate}
                  type="button"
                >
                  New Target
                </button>
            <button
              className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-700 text-white font-semibold text-xs transition"
              onClick={handleDevGridGrow}
              type="button"
            >
              Increase Grid Size +10
            </button>
                <button
                  className={`px-2 py-1 rounded font-semibold text-xs transition ${
                    showExtraGridLines 
                      ? "bg-purple-500 hover:bg-purple-700 text-white" 
                      : "bg-gray-500 hover:bg-gray-700 text-white"
                  }`}
                  onClick={() => setShowExtraGridLines((prev) => !prev)}
                  type="button"
                >
                  {showExtraGridLines ? "Grid+: ON" : "Grid+: OFF"}
                </button>
                <button
                  className={`px-2 py-1 rounded font-semibold text-xs transition ${
                    showExtraGridPlusLines 
                      ? "bg-purple-500 hover:bg-purple-700 text-white" 
                      : "bg-gray-500 hover:bg-gray-700 text-white"
                  }`}
                  onClick={() => setShowExtraGridPlusLines((prev) => !prev)}
                  type="button"
                >
                  {showExtraGridPlusLines ? "Grid++: ON" : "Grid++: OFF"}
                </button>
                <button
                  className={`px-2 py-1 rounded font-semibold text-xs transition ${
                    showExtraGridPlusPlusLines 
                      ? "bg-purple-500 hover:bg-purple-700 text-white" 
                      : "bg-gray-500 hover:bg-gray-700 text-white"
                  }`}
                  onClick={() => setShowExtraGridPlusPlusLines((prev) => !prev)}
                  type="button"
                >
                  {showExtraGridPlusPlusLines ? "Grid+++: ON" : "Grid+++: OFF"}
                </button>
                <button
                  className={`px-2 py-1 rounded font-semibold text-xs transition ${
                    showHomingEffect 
                      ? "bg-green-500 hover:bg-green-700 text-white" 
                      : "bg-gray-500 hover:bg-gray-700 text-white"
                  }`}
                  onClick={() => setShowHomingEffect((prev) => !prev)}
                  type="button"
                >
                  {showHomingEffect ? "Homing: ON" : "Homing: OFF"}
                </button>
                <span className="text-center text-gray-600 dark:text-gray-400">
                  Current: {maxCoord} x {maxCoord}
            </span>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Transparent canvas for grid and interactions */}
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 5,
        }}
        className={`${
          isSpacePressed ? "cursor-grab" : isDragging ? "cursor-grabbing" : isWaiting ? "cursor-wait" : isMouseInGrid ? "cursor-crosshair" : "cursor-default"
        }`}
            aria-label="XY grid"
                            onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleCanvasTouchMove}
        onTouchEnd={handleCanvasTouchEnd}
      />
      
      {/* Result popup */}
      {showResult && resultMessage && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-gray-800/25 dark:bg-gray-950/25 backdrop-blur-[1px] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl px-6 py-4 sm:px-8 sm:py-6 max-w-md pointer-events-auto animate-in fade-in duration-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {typeof score === "number" && (
                  <span className={`${
                    score === 100 ? "relative bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse overflow-hidden" :
                    score >= 90 ? "text-orange-600 dark:text-orange-400" :
                    score >= 70 ? "text-blue-600 dark:text-blue-400" :
                    score >= 40 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400"
                  }`}>
                    {score} Points
                    {score === 100 && (
                      <span 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine bg-clip-text text-transparent"
          style={{
                          animation: 'shine 2s ease-in-out infinite',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          backgroundSize: '200% 100%',
                          backgroundPosition: '-200% 0',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {score} Points
                      </span>
                    )}
                  </span>
                )}
        </div>
              <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                {resultMessage}
      </div>
              {typeof distance === "number" && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Distance: {distance.toFixed(2)} units
                </div>
              )}
              {showGridGrowMessage && (
                <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-4 animate-pulse">
                  🎉 Grid size increased! Now {maxCoord} x {maxCoord}
                </div>
              )}
              {isWaiting && (
                <button
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors duration-200 shadow-sm"
                  onClick={handleNextRound}
                  type="button"
                >
                  Next Round
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Floating game info bar */}
      <FloatingGameInfoBar
        totalScore={totalScore}
        highScoreStreak={highScoreStreak}
        level={level}
      />

      {/* Player Avatar - Top Right */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 pointer-events-none">
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => setShowProfileModal(true)}
          >
            <span className="text-white font-bold text-lg sm:text-xl">👤</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Player
          </div>
        </div>
      </div>

      {/* Separate Powerups Container */}
      <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 pointer-events-none flex justify-end">
        <div className="bg-white/95 dark:bg-gray-950/95 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-sm pointer-events-auto px-3 py-3 sm:px-4 sm:py-4"
          style={{ fontSize: "0.8rem", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}>
          
          {/* Header */}
          <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 text-center sm:text-center">
            Powerups
          </div>
          
          {/* Mobile: Horizontal layout, Tablet+: Vertical layout */}
          <div className="flex flex-row md:flex-col gap-4 md:gap-3">
            {/* Passive Section */}
            <div className="flex-1 md:mb-3">
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                Passive
              </div>
              <div className="flex items-center gap-1 min-h-[20px]">
                {streakFreeze && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded">
                    <span 
                      className="text-sm animate-pulse"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Streak Freeze", description: "Protects your streak from being lost on your next guess" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      🛡️
                    </span>
                    <span 
                      className="text-xl font-extrabold text-blue-500 dark:text-blue-400"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Streak Freeze", description: "Protects your streak from being lost on your next guess" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      Freeze
                    </span>
                  </div>
                )}
                {showHomingEffect && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded">
                    <span 
                      className="text-sm"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Homing", description: "Shows a circle around your cursor that turns green as you get closer to the target" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      🎯
                    </span>
                    <span 
                      className="text-xl font-extrabold text-green-500 dark:text-green-400"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Homing", description: "Shows a circle around your cursor that turns green as you get closer to the target" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      Homing
                    </span>
                  </div>
                )}
                {!streakFreeze && !showHomingEffect && (
                  <span className="text-xs text-gray-400 dark:text-gray-600">None</span>
                )}
              </div>
            </div>
            
            {/* Active Section */}
            <div className="flex-1">
              <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                Active
              </div>
              <div className="flex flex-col gap-1 min-h-[20px]">
                {hasExtraGridPowerup && (
                  <div 
                    className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded transition-all duration-200 ${
                      showExtraGridLines 
                        ? 'border-2 border-green-400 dark:border-green-300 shadow-lg shadow-green-200 dark:shadow-green-900/30 bg-green-400/20 dark:bg-green-300/20' 
                        : 'border border-transparent hover:bg-green-50 dark:hover:bg-green-950/30'
                    }`}
                    onClick={() => {
                      handleActivateExtraGrid();
                      setTooltip(null); // Close tooltip when powerup is activated
                    }}
                  >
                    <span 
                      className="text-sm"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Grid+", description: "Adds 2 extra grid lines evenly spaced" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      📐
                    </span>
                    <span 
                      className="text-xl font-extrabold text-green-600 dark:text-green-400"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Grid+", description: "Adds 2 extra grid lines evenly spaced" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      Grid+
                    </span>
                  </div>
                )}
                {hasExtraGridPlusPowerup && (
                  <div 
                    className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded transition-all duration-200 ${
                      showExtraGridPlusLines 
                        ? 'border-2 border-green-400 dark:border-green-300 shadow-lg shadow-green-200 dark:shadow-green-900/30 bg-green-400/20 dark:bg-green-300/20' 
                        : 'border border-transparent hover:bg-green-50 dark:hover:bg-green-950/30'
                    }`}
                    onClick={() => {
                      handleActivateExtraGridPlus();
                      setTooltip(null); // Close tooltip when powerup is activated
                    }}
                  >
                    <span 
                      className="text-sm"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Grid++", description: "Adds 4 extra grid lines evenly spaced" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      📐📐
                    </span>
                    <span 
                      className="text-xl font-extrabold text-green-600 dark:text-green-400"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Grid++", description: "Adds 4 extra grid lines evenly spaced" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      Grid++
                    </span>
                  </div>
                )}
                {hasExtraGridPlusPlusPowerup && (
                  <div 
                    className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded transition-all duration-200 ${
                      showExtraGridPlusPlusLines 
                        ? 'border-2 border-green-400 dark:border-green-300 shadow-lg shadow-green-200 dark:shadow-green-900/30 bg-green-400/20 dark:bg-green-300/20' 
                        : 'border border-transparent hover:bg-green-50 dark:hover:bg-green-950/30'
                    }`}
                    onClick={() => {
                      handleActivateExtraGridPlusPlus();
                      setTooltip(null); // Close tooltip when powerup is activated
                    }}
                  >
                    <span 
                      className="text-sm"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Grid+++", description: "Adds 8 extra grid lines evenly spaced" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      📐📐📐
                    </span>
                    <span 
                      className="text-xl font-extrabold text-green-600 dark:text-green-400"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Grid+++", description: "Adds 8 extra grid lines evenly spaced" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      Grid+++
                    </span>
                  </div>
                )}
                {hasPulsePowerup && (
                  <div 
                    className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded transition-all duration-200 ${
                      showPulseEffect 
                        ? 'border-2 border-blue-400 dark:border-blue-300 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 bg-blue-400/20 dark:bg-blue-300/20' 
                        : 'border border-transparent hover:bg-blue-50 dark:hover:bg-blue-950/30'
                    }`}
                    onClick={() => {
                      handleActivatePulse();
                      setTooltip(null); // Close tooltip when powerup is consumed
                    }}
                  >
                    <span 
                      className="text-sm"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Target Pulse", description: "Reveals the target location with a visual pulse effect" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      📍
                    </span>
                    <span 
                      className="text-xl font-extrabold text-blue-600 dark:text-blue-400"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Target Pulse", description: "Reveals the target location with a visual pulse effect" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      Pulse
                    </span>
                  </div>
                )}
                {hasLevelJumpPowerup && (
                  <div 
                    className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded transition-all duration-200 ${
                      showLevelJumpGlow 
                        ? 'border-2 border-purple-400 dark:border-purple-300 shadow-lg shadow-purple-200 dark:shadow-purple-900/30 bg-purple-400/20 dark:bg-purple-300/20' 
                        : 'border border-transparent hover:bg-purple-50 dark:hover:bg-purple-950/30'
                    }`}
                    onClick={handleActivateLevelJump}
                  >
                    <span 
                      className="text-sm"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Level Jump", description: "Score 97+ to immediately advance to the next level" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      ⚡
                    </span>
                    <span 
                      className="text-xl font-extrabold text-purple-600 dark:text-purple-400"
                      onMouseEnter={(e) => setTooltip({ show: true, x: e.clientX, y: e.clientY, title: "Level Jump", description: "Score 97+ to immediately advance to the next level" })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      Jump
                    </span>
                  </div>
                )}

                {!hasExtraGridPowerup && !hasExtraGridPlusPowerup && !hasExtraGridPlusPlusPowerup && !hasPulsePowerup && !hasLevelJumpPowerup && (
                  <span className="text-xs text-gray-400 dark:text-gray-600">None</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div 
          className="fixed pointer-events-none z-[60] bg-white/95 dark:bg-gray-950/95 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg backdrop-blur-sm px-3 py-2 text-xs"
          style={{
            left: Math.min(tooltip.x - 90, window.innerWidth - 200),
            top: Math.max(tooltip.y - 80, 10),
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
            maxWidth: "180px"
          }}
        >
          <div className="font-semibold text-gray-900 dark:text-white mb-1">{tooltip.title}</div>
          <div className="text-gray-600 dark:text-gray-300 leading-tight">{tooltip.description}</div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            onClick={() => setShowProfileModal(false)}
          />
          
          {/* Modal */}
          <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-[80] transform transition-transform duration-300 ease-out ${
            showProfileModal ? 'translate-x-0' : 'translate-x-full'
          }`}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">👤</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Player Name</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gridshot Master</p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Game Stats</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1,247</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Games Played</div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">89.2%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">156</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Best Streak</div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">42</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Current Level</div>
                  </div>
                </div>
              </div>

              {/* Achievements Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Recent Achievements</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span className="text-xl">🏆</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Perfect Score</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Scored 100 points</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-xl">🔥</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Streak Master</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">10+ game streak</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xl">⚡</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Speed Demon</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Under 2s average</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Settings</h4>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 dark:text-gray-400">⚙️</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Game Settings</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 dark:text-gray-400">📊</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">View Statistics</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 dark:text-gray-400">🏆</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Achievements</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
