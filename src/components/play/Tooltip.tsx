interface TooltipProps {
  tooltip: { show: boolean; x: number; y: number; title: string; description: string } | null;
}

export default function Tooltip({ tooltip }: TooltipProps) {
  if (!tooltip) return null;

  return (
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
  );
}
