import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../util/supabase';
import type { Session } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  isLoading: boolean;
  isLoggingOut: boolean;
}

export interface AuthActions {
  handleLogout: () => Promise<void>;
}

export function useAuth() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check authentication on mount
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

  // Handle logout
  const handleLogout = useCallback(async () => {
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
  }, [navigate]);

  const authState: AuthState = {
    session,
    isLoading,
    isLoggingOut
  };

  const authActions: AuthActions = {
    handleLogout
  };

  return { authState, authActions };
}
