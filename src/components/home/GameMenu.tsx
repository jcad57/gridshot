import { Link } from "react-router";
import { useTheme } from "../ThemeProvider";
import { getThemeClasses } from "../../utils/themeUtils";

interface GameMenuProps {
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function GameMenu({ onLogout, isLoggingOut }: GameMenuProps) {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  return (
    <div className="relative z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-8 py-12 flex flex-col items-center gap-8 w-[340px]"
      style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}>
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
        Gridshot
      </h1>
      <nav className="flex flex-col gap-4 w-full">
        <Link
          to="/play"
          className={`w-full py-3 rounded-lg ${themeClasses.primary} text-white text-lg font-semibold text-center transition-colors duration-200 shadow-sm hover:shadow-md`}
        >
          Play
        </Link>
        <Link
          to="/settings"
          className="w-full py-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 text-lg font-semibold text-center transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Settings
        </Link>
        <Link
          to="/leaderboard"
          className="w-full py-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-lg font-semibold text-center transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Leaderboard
        </Link>
      </nav>
      <button
        className="w-full mt-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-lg font-semibold text-center transition-colors duration-200 shadow-sm hover:shadow-md"
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Signing out...
          </div>
        ) : (
          "Log Out"
        )}
      </button>
    </div>
  );
}
