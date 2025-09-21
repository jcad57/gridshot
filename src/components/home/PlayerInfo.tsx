import PlayerAvatar from '../play/PlayerAvatar';
import ProfileModal from '../play/ProfileModal';
import type { Session } from '@supabase/supabase-js';

interface PlayerInfoProps {
  session: Session;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

export default function PlayerInfo({ 
  session, 
  showProfileModal, 
  setShowProfileModal 
}: PlayerInfoProps) {

  
  return (
    <>
      <div className="fixed top-4 right-4 z-20 flex flex-col items-end gap-2">
        <PlayerAvatar 
          setShowProfileModal={setShowProfileModal} 
          session={session}
        />
      </div>
      <ProfileModal 
        showProfileModal={showProfileModal} 
        setShowProfileModal={setShowProfileModal}
        userEmail={session.user.email}
      />
    </>
  );
}
