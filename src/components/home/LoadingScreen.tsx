import InfiniteGridBackground from './InfiniteGridBackground';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20 relative overflow-hidden">
      <InfiniteGridBackground />
      <div className="relative z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-8 py-12 flex flex-col items-center gap-4 w-[340px]"
        style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </main>
  );
}
