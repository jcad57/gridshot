import { useRef, useEffect, useCallback } from "react";

interface GameCanvasProps {
  canvasWidth: number;
  canvasHeight: number;
  cellSize: number;
  gridCells: number;
  axisOffset: number;
  gridSize: number;
  maxCoord: number;
  clickedCoord: { x: number; y: number } | null;
  randomCoord: { x: number; y: number };
  hasGuessed: boolean;
  showExtraGridLines: boolean;
  showExtraGridPlusLines: boolean;
  showExtraGridPlusPlusLines: boolean;
  mousePosition: { x: number; y: number } | null;
  rippleAnimation: { x: number; y: number; startTime: number; duration: number } | null;
  setRippleAnimation: (animation: { x: number; y: number; startTime: number; duration: number } | null) => void;
  pulseAnimation: { x: number; y: number; radius: number; opacity: number; startTime: number } | null;
  setPulseAnimation: (animation: { x: number; y: number; radius: number; opacity: number; startTime: number } | null) => void;
  setShowPulseEffect: (show: boolean) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  gridWidth: number;
  gridHeight: number;
  showLevelUpGlow: boolean;
  showLevelJumpGlow: boolean;
  gridSizeAnimation: { isAnimating: boolean; startSize: number; targetSize: number; startTime: number; duration: number } | null;
  showHomingEffect: boolean;
  isSpacePressed: boolean;
  isDragging: boolean;
  isWaiting: boolean;
  isMouseInGrid: boolean;
  handleCanvasMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleCanvasMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleCanvasMouseUp: () => void;
  handleCanvasMouseLeave: () => void;
  handleCanvasTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleCanvasTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleCanvasTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void;
}

export default function GameCanvas({
  canvasWidth,
  canvasHeight,
  cellSize,
  gridCells,
  axisOffset,
  gridSize,
  maxCoord,
  clickedCoord,
  randomCoord,
  hasGuessed,
  showExtraGridLines,
  showExtraGridPlusLines,
  showExtraGridPlusPlusLines,
  mousePosition,
  rippleAnimation,
  setRippleAnimation,
  pulseAnimation,
  setPulseAnimation,
  setShowPulseEffect,
  panOffset,
  setPanOffset,
  gridWidth,
  gridHeight,
  showLevelUpGlow,
  showLevelJumpGlow,
  gridSizeAnimation,
  showHomingEffect,
  isSpacePressed,
  isDragging,
  isWaiting,
  isMouseInGrid,
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  handleCanvasMouseLeave,
  handleCanvasTouchStart,
  handleCanvasTouchMove,
  handleCanvasTouchEnd,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        // Animation complete, clear pulse and consume powerup
        setPulseAnimation(null);
        setShowPulseEffect(false);
        // Note: The powerup consumption will be handled by the parent component
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
    showHomingEffect,
    setRippleAnimation,
    setPulseAnimation,
    setShowPulseEffect,
    setPanOffset,
  ]);

  return (
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
  );
}
