// src/hooks/auth/useAuth.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  user: { id: string; email: string } | null;
  isAuthenticated: boolean;
  profileComplete: boolean;
  loading: boolean;
}

/**
 * Custom hook for managing authentication state
 * Handles user session, profile completion status, and auth state changes
 */
export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    profileComplete: false,
    loading: true,
  });

  /**
   * Checks if user's profile is complete by verifying study_cycle_id exists
   * @param userId - The user's unique identifier
   * @returns Promise<boolean> - True if profile is complete
   */
  const checkProfileCompletion = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_study_config")
        .select("study_cycle_id")
        .eq("user_id", userId)
        .maybeSingle();

      return !error && !!data?.study_cycle_id;
    } catch (error) {
      console.error("Error checking profile completion:", error);
      return false;
    }
  }, []);

  /**
   * Handles authentication state changes
   * @param session - Current Supabase session or null if signed out
   * @returns Promise<boolean> - Profile completion status (if signed in)
   */
  const handleAuthChange = useCallback(
    async (session: Session | null) => {
      if (session) {
        const isComplete = await checkProfileCompletion(session.user.id);

        setAuthState({
          user: { id: session.user.id, email: session.user.email || "" },
          isAuthenticated: true,
          profileComplete: isComplete,
          loading: false,
        });
        return isComplete;
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          profileComplete: false,
          loading: false,
        });
        return false;
      }
    },
    [checkProfileCompletion]
  );

  // Initialize auth state and set up listeners
  useEffect(() => {
    let isMounted = true;

    /**
     * Initializes authentication state by checking current session
     */
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (isMounted && session) {
        await handleAuthChange(session);
      }
    };

    /**
     * Handles auth state changes:
     * - Updates profile completion status on sign in
     * - Maintains current auth state
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Force profile check on sign in
      if (event === "SIGNED_IN" && session) {
        const isComplete = await checkProfileCompletion(session.user.id);
        setAuthState((prev) => ({
          ...prev,
          profileComplete: isComplete,
        }));
      }

      // Update auth state for all session changes
      if (session) {
        await handleAuthChange(session);
      }
    });

    initializeAuth();

    // Cleanup function to unsubscribe from auth events
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [handleAuthChange, checkProfileCompletion]);

  return authState;
}
