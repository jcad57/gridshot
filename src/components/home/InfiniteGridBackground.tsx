import { useRef, useEffect } from 'react';

export default function InfiniteGridBackground() {
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
