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
