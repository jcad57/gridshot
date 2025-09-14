import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { useRef, useEffect, useState } from "react";
import { supabase } from "../../util/supabase";
import type { Session } from "@supabase/supabase-js";
import PlayerAvatar from "src/components/play/PlayerAvatar";
import ProfileModal from "src/components/play/ProfileModal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}


export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // User is not authenticated, redirect to auth
          navigate("/auth");
        } else {
          setSession(session);
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      } else {
        // Redirect to auth page after successful logout
        navigate("/auth");
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 relative overflow-hidden">
        <InfiniteGridBackground />
        <div className="relative z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-8 py-12 flex flex-col items-center gap-4 w-[340px]"
          style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </main>
    );
  }

  // This should rarely be reached due to redirects, but keeping as fallback
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 relative overflow-hidden">
      <InfiniteGridBackground />
      <GameMenu onLogout={handleLogout} isLoggingOut={isLoggingOut} />
       {/* Profile Modal */}
      {session && <><PlayerAvatar setShowProfileModal={setShowProfileModal} />
        <ProfileModal 
         showProfileModal={showProfileModal} 
         setShowProfileModal={setShowProfileModal}
         userEmail={session.user.email}
       /></>}
    </main>
  );
}

interface GameMenuProps {
  onLogout: () => void;
  isLoggingOut: boolean;
}

function GameMenu({ onLogout, isLoggingOut }: GameMenuProps) {
 
  return (
    <div className="relative z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-8 py-12 flex flex-col items-center gap-8 w-[340px]"
      style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}>
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
        Gridshot
      </h1>
      <nav className="flex flex-col gap-4 w-full">
        <Link
          to="/play"
          className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold text-center transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Play
        </Link>
        <a
          href="#"
          className="w-full py-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 text-lg font-semibold text-center transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Settings
        </a>
        <a
          href="#"
          className="w-full py-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-lg font-semibold text-center transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Leaderboard
        </a>
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


function InfiniteGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const offset = useRef({ x: 0, y: 0 });

  // Grid settings
  const gridSize = 40;
  
  // Get current theme
  const isDarkMode = typeof window !== 'undefined' && 
    (document.documentElement.classList.contains('dark') || 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const lineColor = isDarkMode ? "#334155" : "#e2e8f0"; // slate-700 for dark, slate-200 for light

  // Animate the grid to scroll diagonally
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    function handleThemeChange() {
      // Force re-render when theme changes
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animate();
    }

    resize();
    window.addEventListener("resize", resize);
    
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      
      // Fill canvas with blue/purple radial gradient background for depth
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) * 0.8; // 80% of the larger dimension
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      if (isDarkMode) {
        gradient.addColorStop(0, '#0f3460');    // Darker blue at center
        gradient.addColorStop(0.5, '#16213e');  // Medium blue
        gradient.addColorStop(1, '#1a1a2e');    // Dark blue/purple at edges
      } else {
        gradient.addColorStop(0, '#d1e7ff');    // Slightly darker light blue at center
        gradient.addColorStop(0.5, '#e8f2ff');  // Light blue
        gradient.addColorStop(1, '#f8f9ff');    // Very light blue at edges
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Add moving dot texture pattern to the background
      const dotSize = 2;
      const dotSpacing = 20;
      const dotOpacity = 0.5;
      
      // Calculate offset for dot animation
      offset.current.x = (offset.current.x + 0.3) % dotSpacing;
      offset.current.y = (offset.current.y + 0.3) % dotSpacing;
      
      ctx.fillStyle = isDarkMode ? `rgba(100, 100, 100, ${dotOpacity})` : `rgba(150, 150, 150, ${dotOpacity})`;
      
      for (let x = -dotSpacing + offset.current.x; x < width + dotSpacing; x += dotSpacing) {
        for (let y = -dotSpacing + offset.current.y; y < height + dotSpacing; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function animate() {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      mediaQuery.removeEventListener('change', handleThemeChange);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}

export { InfiniteGridBackground };
