// src/hooks/auth/useAuth.ts
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [authState, setAuthState] = useState<{
    user: { id: string; email: string } | null;
    isAuthenticated: boolean;
    profileComplete: boolean;
    loading: boolean;
  }>({
    user: null,
    isAuthenticated: false,
    profileComplete: false,
    loading: true,
  });

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (
      session: import("@supabase/supabase-js").Session | null
    ) => {
      if (!isMounted) return;

      if (session) {
        const studyConfig = await fetchStudyConfig(session.user.id);
        setAuthState({
          user: { id: session.user.id, email: session.user.email || "" },
          isAuthenticated: true,
          profileComplete: !!studyConfig?.study_cycle_id,
          loading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          profileComplete: false,
          loading: false,
        });
      }
    };

    const fetchStudyConfig = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("user_study_config")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        return error ? null : data;
      } catch (error) {
        console.error("Error fetching study config:", error);
        return null;
      }
    };

    // Verifică sesiunea inițială
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Ascultă pentru schimbări de autentificare
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      handleAuthChange(session);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  return authState;
}
