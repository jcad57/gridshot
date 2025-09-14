interface PlayerAvatarProps {
  setShowProfileModal: (show: boolean) => void;
}

export default function PlayerAvatar({ setShowProfileModal }: PlayerAvatarProps) {
  return (
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 pointer-events-none">
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        <div 
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
          onClick={() => setShowProfileModal(true)}
        >
          <span className="text-white font-bold text-lg sm:text-xl">👤</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          Player
        </div>
      </div>
    </div>
  );
}
