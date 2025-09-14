interface PowerupsContainerProps {
  streakFreeze: boolean;
  showHomingEffect: boolean;
  hasExtraGridPowerup: boolean;
  showExtraGridLines: boolean;
  handleActivateExtraGrid: () => void;
  hasExtraGridPlusPowerup: boolean;
  showExtraGridPlusLines: boolean;
  handleActivateExtraGridPlus: () => void;
  hasExtraGridPlusPlusPowerup: boolean;
  showExtraGridPlusPlusLines: boolean;
  handleActivateExtraGridPlusPlus: () => void;
  hasPulsePowerup: boolean;
  showPulseEffect: boolean;
  handleActivatePulse: () => void;
  hasLevelJumpPowerup: boolean;
  showLevelJumpGlow: boolean;
  handleActivateLevelJump: () => void;
  setTooltip: (tooltip: { show: boolean; x: number; y: number; title: string; description: string } | null) => void;
}

export default function PowerupsContainer({
  streakFreeze,
  showHomingEffect,
  hasExtraGridPowerup,
  showExtraGridLines,
  handleActivateExtraGrid,
  hasExtraGridPlusPowerup,
  showExtraGridPlusLines,
  handleActivateExtraGridPlus,
  hasExtraGridPlusPlusPowerup,
  showExtraGridPlusPlusLines,
  handleActivateExtraGridPlusPlus,
  hasPulsePowerup,
  showPulseEffect,
  handleActivatePulse,
  hasLevelJumpPowerup,
  showLevelJumpGlow,
  handleActivateLevelJump,
  setTooltip,
}: PowerupsContainerProps) {
  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 pointer-events-none flex justify-end">
      <div 
        className="bg-white/95 dark:bg-gray-950/95 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-sm pointer-events-auto px-3 py-3 sm:px-4 sm:py-4"
        style={{ fontSize: "0.8rem", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}
      >
        
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
  );
}
