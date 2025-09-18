import { useState, useEffect } from "react";
import FloatingGameInfoBar from "../../src/components/play/FloatingGameInfoBar";
import TargetDisplay from "../../src/components/play/TargetDisplay";
import DeveloperMenu from "../../src/components/play/DeveloperMenu";
import PowerupsContainer from "../../src/components/play/PowerupsContainer";
import ResultPopup from "../../src/components/play/ResultPopup";
import PlayerAvatar from "../../src/components/play/PlayerAvatar";
import ProfileModal from "../../src/components/play/ProfileModal";
import Tooltip from "../../src/components/play/Tooltip";
import GameCanvas from "../../src/components/play/GameCanvas";
import { useGameLogic } from "../../src/hooks/useGameLogic";


export default function Play() {
  // Use the custom game logic hook
  const {
    profileState,
    gameState,
    powerupState,
    canvasState,
    animationState,
    gameActions,
    powerupActions,
    canvasActions,
    animationActions,
    handleGridClick,
    handleNextRound,
    handleRegenerate,
    handleActivatePulse,
    canvasDimensions
  } = useGameLogic();

  // Local state for UI elements
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; title: string; description: string } | null>(null);
  const [showDevMenu, setShowDevMenu] = useState<boolean>(false);

  // Keyboard event handling for dev menu toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "D" && (e.ctrlKey || e.metaKey)) {
        setShowDevMenu((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
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

  // Developer menu: manual grid size increase
  const handleDevGridGrow = () => {
    gameActions.levelUp();
    powerupActions.resetAllPowerups();
    animationActions.startGridSizeTransition(
      canvasDimensions.cellSize * gameState.gridCells,
      canvasDimensions.cellSize * (gameState.gridCells + 1)
    );
  };

  // Track if the user has made a guess
  const hasGuessed = gameState.clickedCoord !== null;

  // Show the grid grow message only after the grid has actually grown
  const showGridGrowMessage = gameState.highScoreStreak > 0 && gameState.highScoreStreak % 3 === 0 && !gameState.pendingGridGrow;



  // Show loading screen while profile data is loading
  if (profileState.isLoadingProfile) {
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
      <TargetDisplay randomCoord={gameState.randomCoord} />
      
      
      {/* Fixed UI Elements */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="pointer-events-auto">
          <DeveloperMenu
            showDevMenu={showDevMenu}
            setShowDevMenu={setShowDevMenu}
            handleRegenerate={handleRegenerate}
            handleDevGridGrow={handleDevGridGrow}
            showExtraGridLines={powerupState.showExtraGridLines}
            setShowExtraGridLines={powerupActions.setShowExtraGridLines}
            showExtraGridPlusLines={powerupState.showExtraGridPlusLines}
            setShowExtraGridPlusLines={powerupActions.setShowExtraGridPlusLines}
            showExtraGridPlusPlusLines={powerupState.showExtraGridPlusPlusLines}
            setShowExtraGridPlusPlusLines={powerupActions.setShowExtraGridPlusPlusLines}
            showHomingEffect={powerupState.showHomingEffect}
            setShowHomingEffect={powerupActions.setShowHomingEffect}
            maxCoord={gameState.maxCoord}
          />
        </div>
      </div>

      {/* Game Canvas */}
      <GameCanvas
        canvasWidth={canvasDimensions.canvasWidth}
        canvasHeight={canvasDimensions.canvasHeight}
        cellSize={canvasDimensions.cellSize}
        gridCells={gameState.gridCells}
        axisOffset={canvasDimensions.axisOffset}
        gridSize={canvasDimensions.gridSize}
        maxCoord={gameState.maxCoord}
        clickedCoord={gameState.clickedCoord}
        randomCoord={gameState.randomCoord}
        hasGuessed={hasGuessed}
        showExtraGridLines={powerupState.showExtraGridLines}
        showExtraGridPlusLines={powerupState.showExtraGridPlusLines}
        showExtraGridPlusPlusLines={powerupState.showExtraGridPlusPlusLines}
        mousePosition={canvasState.mousePosition}
        rippleAnimation={animationState.rippleAnimation}
        setRippleAnimation={animationActions.setRippleAnimation}
        pulseAnimation={powerupState.pulseAnimation}
        setPulseAnimation={powerupActions.setPulseAnimation}
        setShowPulseEffect={powerupActions.setShowPulseEffect}
        panOffset={canvasState.panOffset}
        setPanOffset={canvasActions.setPanOffset}
        gridWidth={canvasDimensions.gridWidth}
        gridHeight={canvasDimensions.gridHeight}
        showLevelUpGlow={gameState.showLevelUpGlow}
        showLevelJumpGlow={powerupState.showLevelJumpGlow}
        gridSizeAnimation={animationState.gridSizeAnimation}
        showHomingEffect={powerupState.showHomingEffect}
        isSpacePressed={canvasState.isSpacePressed}
        isDragging={canvasState.isDragging}
        isWaiting={gameState.isWaiting}
        isMouseInGrid={canvasState.isMouseInGrid}
        handleCanvasMouseDown={(e) => canvasActions.handleMouseDown(e, handleGridClick)}
        handleCanvasMouseMove={canvasActions.handleMouseMove}
        handleCanvasMouseUp={canvasActions.handleMouseUp}
        handleCanvasMouseLeave={canvasActions.handleMouseLeave}
        handleCanvasTouchStart={(e) => canvasActions.handleTouchStart(e, handleGridClick)}
        handleCanvasTouchMove={canvasActions.handleTouchMove}
        handleCanvasTouchEnd={(e) => canvasActions.handleTouchEnd(e, handleGridClick)}
      />
      
      {/* Result Popup */}
      <ResultPopup
        showResult={gameState.showResult}
        resultMessage={gameState.resultMessage}
        score={gameState.score}
        distance={gameState.distance}
        showGridGrowMessage={showGridGrowMessage}
        maxCoord={gameState.maxCoord}
        isWaiting={gameState.isWaiting}
        handleNextRound={handleNextRound}
      />
      
      {/* Floating game info bar */}
      <FloatingGameInfoBar
        totalScore={gameState.stats.totalScore}
        highScoreStreak={gameState.highScoreStreak}
        level={gameState.stats.level}
      />

      {/* Player Avatar */}
      <PlayerAvatar setShowProfileModal={profileState.setShowProfileModal} />

      {/* Powerups Container */}
      <PowerupsContainer
        streakFreeze={powerupState.streakFreeze}
        showHomingEffect={powerupState.showHomingEffect}
        hasExtraGridPowerup={powerupState.hasExtraGridPowerup}
        showExtraGridLines={powerupState.showExtraGridLines}
        handleActivateExtraGrid={powerupActions.activateExtraGrid}
        hasExtraGridPlusPowerup={powerupState.hasExtraGridPlusPowerup}
        showExtraGridPlusLines={powerupState.showExtraGridPlusLines}
        handleActivateExtraGridPlus={powerupActions.activateExtraGridPlus}
        hasExtraGridPlusPlusPowerup={powerupState.hasExtraGridPlusPlusPowerup}
        showExtraGridPlusPlusLines={powerupState.showExtraGridPlusPlusLines}
        handleActivateExtraGridPlusPlus={powerupActions.activateExtraGridPlusPlus}
        hasPulsePowerup={powerupState.hasPulsePowerup}
        showPulseEffect={powerupState.showPulseEffect}
        handleActivatePulse={handleActivatePulse}
        hasLevelJumpPowerup={powerupState.hasLevelJumpPowerup}
        showLevelJumpGlow={powerupState.showLevelJumpGlow}
        handleActivateLevelJump={powerupActions.activateLevelJump}
        setTooltip={setTooltip}
      />

      {/* Tooltip */}
      <Tooltip tooltip={tooltip} />

      {/* Profile Modal */}
      {profileState.session && (
        <ProfileModal 
          showProfileModal={profileState.showProfileModal} 
          setShowProfileModal={profileState.setShowProfileModal}
          userEmail={profileState.session.user.email}
        />
      )}
    </>
  );
}
