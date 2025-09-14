interface TargetDisplayProps {
  randomCoord: { x: number; y: number };
}

export default function TargetDisplay({ randomCoord }: TargetDisplayProps) {
  return (
    <div className="fixed bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-50 pointer-events-none flex justify-center">
      <div 
        className="bg-white/80 dark:bg-gray-950/80 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg backdrop-blur-sm pointer-events-auto px-4 py-3 sm:px-6 sm:py-4"
        style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">Your target:</span>
          <span className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400">({randomCoord.x}, {randomCoord.y})</span>
        </div>
      </div>
    </div>
  );
}
