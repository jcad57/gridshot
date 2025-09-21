import type { Route } from "./+types/home";
import { useAuth } from "../../src/hooks/useAuth";
import { useHomeProfile } from "../../src/hooks/useHomeProfile";
import { useTheme } from "../../src/components/ThemeProvider";
import { getThemeClasses } from "../../src/utils/themeUtils";
import { GameMenu, LoadingScreen, PlayerInfo, InfiniteGridBackground } from "../../src/components/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}


export default function Home() {
  // Use custom hooks for authentication and profile data
  const { authState, authActions } = useAuth();
  const { profileState, profileActions } = useHomeProfile(authState.session);
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  // Show loading state while checking authentication or loading profile
  if (authState.isLoading || profileState.isLoadingProfile) {
    return <LoadingScreen message="Loading game..." />;
  }

  // This should rarely be reached due to redirects, but keeping as fallback
  return (
    <main className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white ${theme === 'red' ? 'to-red-50/30' : 'to-blue-50/30'} dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 ${theme === 'red' ? 'dark:to-red-950/20' : 'dark:to-blue-950/20'} relative overflow-hidden`}>
      <InfiniteGridBackground />
      <GameMenu onLogout={authActions.handleLogout} isLoggingOut={authState.isLoggingOut} />
      {/* Player Info with username display */}
      {authState.session && (
        <PlayerInfo
          session={authState.session}
          showProfileModal={profileState.showProfileModal}
          setShowProfileModal={profileActions.setShowProfileModal}
        />
      )}
    </main>
  );
}

