interface DeveloperMenuProps {
  showDevMenu: boolean;
  setShowDevMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
  handleRegenerate: () => void;
  handleDevGridGrow: () => void;
  showExtraGridLines: boolean;
  setShowExtraGridLines: (show: boolean | ((prev: boolean) => boolean)) => void;
  showExtraGridPlusLines: boolean;
  setShowExtraGridPlusLines: (show: boolean | ((prev: boolean) => boolean)) => void;
  showExtraGridPlusPlusLines: boolean;
  setShowExtraGridPlusPlusLines: (show: boolean | ((prev: boolean) => boolean)) => void;
  showHomingEffect: boolean;
  setShowHomingEffect: (show: boolean | ((prev: boolean) => boolean)) => void;
  maxCoord: number;
}

export default function DeveloperMenu({
  showDevMenu,
  setShowDevMenu,
  handleRegenerate,
  handleDevGridGrow,
  showExtraGridLines,
  setShowExtraGridLines,
  showExtraGridPlusLines,
  setShowExtraGridPlusLines,
  showExtraGridPlusPlusLines,
  setShowExtraGridPlusPlusLines,
  showHomingEffect,
  setShowHomingEffect,
  maxCoord,
}: DeveloperMenuProps) {
  return (
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
  );
}
