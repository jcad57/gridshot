import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/leaderboard";
import { useEffect, useState } from "react";
import { supabase } from "../../util/supabase";
import type { Session } from "@supabase/supabase-js";
import { useTheme } from "../../src/components/ThemeProvider";
import { Leaderboard } from "../../src/components/leaderboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leaderboard - Gridshot" },
    { name: "description", content: "Top players and scores in Gridshot" },
  ];
}

function InfiniteGridBackground({ theme }: { theme: 'blue' | 'red' }) {
  const gridColor = theme === 'red' ? 'rgba(242, 44, 44, 0.1)' : 'rgba(59, 130, 246, 0.1)';
  
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <div className="absolute inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(${gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'float 20s ease-in-out infinite'
        }}
      />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -20px); }
        }
      `}</style>
    </div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUserScore, setCurrentUserScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // User is not authenticated, redirect to auth
          navigate("/auth");
        } else {
          setSession(session);
          
          // Fetch current user's score
          const { data: profileData } = await supabase
            .from('profiles')
            .select('score')
            .eq('user_id', session.user.id)
            .single();
          
          if (profileData) {
            setCurrentUserScore(profileData.score);
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // On error, redirect to auth page
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <main className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white ${theme === 'red' ? 'to-red-50/30' : 'to-blue-50/30'} dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 ${theme === 'red' ? 'dark:to-red-950/20' : 'dark:to-blue-950/20'} relative overflow-hidden`}>
        <InfiniteGridBackground theme={theme} />
        <div className="relative z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-8 py-12 flex flex-col items-center gap-4 w-[340px]"
          style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}>
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme === 'red' ? 'border-red-500' : 'border-blue-500'}`}></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen bg-gradient-to-br from-slate-50 via-white ${theme === 'red' ? 'to-red-50/30' : 'to-blue-50/30'} dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 ${theme === 'red' ? 'dark:to-red-950/20' : 'dark:to-blue-950/20'} relative overflow-hidden`}>
      <InfiniteGridBackground theme={theme} />
      
      {/* Header Navigation */}
      <div className="relative z-10">
        <div className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <h1 className="text-xl font-bold text-white">Leaderboard</h1>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-8">
        <Leaderboard currentUserScore={currentUserScore} />
      </div>

     
    </main>
  );
}
