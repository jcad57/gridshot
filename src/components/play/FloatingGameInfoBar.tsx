interface FloatingGameInfoBarProps {
  totalScore: number;
  hits: number;
  level: number;
}

export default function FloatingGameInfoBar({
  totalScore,
  hits,
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

        {/* Hits info */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-1 text-orange-700 dark:text-orange-300">
            <span className="text-xs font-semibold">Hits</span>
            <span className="text-lg font-extrabold">
              {hits > 0 ? `🎯 ${hits}` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
