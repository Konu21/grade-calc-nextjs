"use client";
import { ThemeProvider } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SidebarProvider } from "@/components/ui/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <div className="w-full">{children}</div>
      </AuthProvider>
    </ThemeProvider>
  );
}

function clearSupabaseAuthStorage() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_DB_URL;
    const keysToRemove: string[] = [];

    if (supabaseUrl) {
      const url = new URL(supabaseUrl);
      const projectRef = url.hostname.split(".")[0];
      keysToRemove.push(`sb-${projectRef}-auth-token`);
      keysToRemove.push(`sb.${projectRef}.auth-token`);
    }

    for (const key of keysToRemove) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (/^sb-.*-auth-token$/i.test(key)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error("Eroare la curățarea sesiunii Supabase:", error);
  }
}

type AuthContextType = {
  isAuthenticated: boolean;
  user: { id: string; email?: string } | null;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthContextType>({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    const enforceNonPersistent = () => {
      if (typeof window === "undefined") return;
      const nonPersistent = sessionStorage.getItem("nonPersistentAuth") === "1";
      if (nonPersistent) {
        clearSupabaseAuthStorage();
      }
    };

    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        setAuthState({
          isAuthenticated: !!session,
          user: session?.user
            ? {
                id: session.user.id,
                email: session.user.email,
              }
            : null,
        });
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthState({
          isAuthenticated: false,
          user: null,
        });
      } finally {
        enforceNonPersistent();
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        isAuthenticated: !!session,
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
            }
          : null,
      });
      // Re-șterge orice token salvat dacă sesiunea trebuie să fie non-persistentă
      if (typeof window !== "undefined" && sessionStorage.getItem("nonPersistentAuth") === "1") {
        clearSupabaseAuthStorage();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {authState.isAuthenticated ? (
        <SidebarProvider>{children}</SidebarProvider>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
