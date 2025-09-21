import type { Session } from '@supabase/supabase-js';
import { useProfileData } from '../../utils/profileDataUtils';
import { useTheme } from '../ThemeProvider';

interface PlayerAvatarProps {
  setShowProfileModal: (show: boolean) => void;
  session: Session;
}

export default function PlayerAvatar({ setShowProfileModal, session }: PlayerAvatarProps) {
  const { displayName, isLoading } = useProfileData(session);
  const { theme } = useTheme();
  
  return (
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 pointer-events-none">
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        <div 
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${theme === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'} flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200`}
          onClick={() => setShowProfileModal(true)}
        >
          <span className="text-white font-bold text-lg sm:text-xl">👤</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          {displayName}
        </div>
      </div>
    </div>
  );
}
