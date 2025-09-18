import { useState, useCallback, useEffect } from 'react';
import type { Coordinate } from '../utils/gameUtils';

export interface CanvasState {
  panOffset: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  isSpacePressed: boolean;
  isRecentering: boolean;
  mousePosition: { x: number; y: number } | null;
  isMouseInGrid: boolean;
}

export interface CanvasActions {
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragStart: (start: { x: number; y: number } | null) => void;
  setIsSpacePressed: (pressed: boolean) => void;
  setIsRecentering: (recentering: boolean) => void;
  setMousePosition: (position: { x: number; y: number } | null) => void;
  setIsMouseInGrid: (inGrid: boolean) => void;
  smoothRecenter: () => void;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>, onGridClick: (coord: Coordinate) => void) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  handleTouchStart: (e: React.TouchEvent<HTMLCanvasElement>, onGridClick: (coord: Coordinate) => void) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  handleTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>, onGridClick: (coord: Coordinate) => void) => void;
}

interface CanvasDimensions {
  canvasWidth: number;
  canvasHeight: number;
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  axisOffset: number;
  maxCoord: number;
  cellSize: number;
}

export function useCanvasInteractions(dimensions: CanvasDimensions) {
  const {
    canvasWidth,
    canvasHeight,
    gridWidth,
    gridHeight,
    gridSize,
    axisOffset,
    maxCoord,
    cellSize
  } = dimensions;

  // Canvas state
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isRecentering, setIsRecentering] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isMouseInGrid, setIsMouseInGrid] = useState<boolean>(false);

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

  // Convert canvas coordinates to grid coordinates
  const canvasToGridCoords = useCallback((mouseX: number, mouseY: number): Coordinate | null => {
    const gridX = (canvasWidth - gridWidth) / 2 + panOffset.x;
    const gridY = (canvasHeight - gridHeight) / 2 + panOffset.y;
    
    const gridRelativeX = mouseX - gridX;
    const gridRelativeY = mouseY - gridY;

    // Check if inside grid area
    if (
      gridRelativeX >= axisOffset &&
      gridRelativeX <= axisOffset + gridSize &&
      gridRelativeY >= axisOffset &&
      gridRelativeY <= axisOffset + gridSize
    ) {
      // Convert to grid coordinates (0-maxCoord, step 1)
      const x = Math.round(((gridRelativeX - axisOffset) / gridSize) * maxCoord);
      const y = Math.round(((gridSize - (gridRelativeY - axisOffset)) / gridSize) * maxCoord);
      return { x, y };
    }
    
    return null;
  }, [canvasWidth, canvasHeight, gridWidth, gridHeight, panOffset, axisOffset, gridSize, maxCoord]);

  // Mouse event handlers
  const handleMouseDown = useCallback((
    e: React.MouseEvent<HTMLCanvasElement>,
    onGridClick: (coord: Coordinate) => void
  ) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isSpacePressed) {
      // Start dragging for panning
      setIsDragging(true);
      setDragStart({ x: mouseX, y: mouseY });
    } else {
      // Check for grid click
      const gridCoord = canvasToGridCoords(mouseX, mouseY);
      if (gridCoord) {
        onGridClick(gridCoord);
      }
    }
  }, [isSpacePressed, canvasToGridCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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
  }, [isDragging, dragStart, isSpacePressed, canvasWidth, canvasHeight, gridWidth, gridHeight, panOffset, axisOffset, gridSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
    setIsMouseInGrid(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((
    e: React.TouchEvent<HTMLCanvasElement>,
    onGridClick: (coord: Coordinate) => void
  ) => {
    e.preventDefault(); // Prevent default touch behaviors like scrolling
    const canvas = e.currentTarget;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // On mobile, always allow panning (no spacebar requirement)
    setIsDragging(true);
    setDragStart({ x: touchX, y: touchY });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default touch behaviors
    if (!isDragging || !dragStart) return;

    const canvas = e.currentTarget;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const deltaX = touchX - dragStart.x;
    const deltaY = touchY - dragStart.y;

    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setDragStart({ x: touchX, y: touchY });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback((
    e: React.TouchEvent<HTMLCanvasElement>,
    onGridClick: (coord: Coordinate) => void
  ) => {
    e.preventDefault();
    
    // If this was a short touch (tap), treat it as a click
    if (dragStart) {
      const canvas = e.currentTarget;
      const touch = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      
      // Check if it was a tap (minimal movement)
      const deltaX = Math.abs(touchX - dragStart.x);
      const deltaY = Math.abs(touchY - dragStart.y);
      const isTap = deltaX < 10 && deltaY < 10; // Less than 10px movement = tap
      
      if (isTap) {
        const gridCoord = canvasToGridCoords(touchX, touchY);
        if (gridCoord) {
          onGridClick(gridCoord);
        }
      }
    }
    
    setIsDragging(false);
    setDragStart(null);
  }, [dragStart, canvasToGridCoords]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Force re-render by updating a state that triggers canvas redraw
      setPanOffset(prev => ({ ...prev }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canvasState: CanvasState = {
    panOffset,
    isDragging,
    dragStart,
    isSpacePressed,
    isRecentering,
    mousePosition,
    isMouseInGrid
  };

  const actions: CanvasActions = {
    setPanOffset: (offset) => {
      if (typeof offset === 'function') {
        setPanOffset(offset);
      } else {
        setPanOffset(offset);
      }
    },
    setIsDragging,
    setDragStart,
    setIsSpacePressed,
    setIsRecentering,
    setMousePosition,
    setIsMouseInGrid,
    smoothRecenter,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };

  return { canvasState, actions };
}
