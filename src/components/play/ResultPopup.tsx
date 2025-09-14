interface ResultPopupProps {
  showResult: boolean;
  resultMessage: string;
  score: number | null;
  distance: number | null;
  showGridGrowMessage: boolean;
  maxCoord: number;
  isWaiting: boolean;
  handleNextRound: () => void;
}

export default function ResultPopup({
  showResult,
  resultMessage,
  score,
  distance,
  showGridGrowMessage,
  maxCoord,
  isWaiting,
  handleNextRound,
}: ResultPopupProps) {
  if (!showResult || !resultMessage) return null;

  return (
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
  );
}
