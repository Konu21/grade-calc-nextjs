// app/login/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";

// Constants for email suggestions configuration
const MAX_SUGGESTIONS = 5;
const SUGGESTION_KEY = "emailSuggestions";

/**
 * Funcție pentru a determina cheia corectă de stocare locală folosită de Supabase pentru autentificare.
 * Cheia este de obicei în formatul `sb.<referința-proiectului>.auth-token`.
 */
const getSupabaseAuthLocalStorageKey = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_DB_URL;
  if (!supabaseUrl) {
    console.error(
      "NEXT_PUBLIC_DB_URL nu este definit. Nu se poate determina cheia de stocare Supabase."
    );
    return null;
  }
  try {
    const url = new URL(supabaseUrl);
    // Presupunem că referința proiectului este prima parte a numelui de gazdă,
    // de ex. "abcdefg1234.supabase.co" -> "abcdefg1234"
    const projectRef = url.hostname.split(".")[0];
    // Acesta este modelul comun pentru cheia token-ului de autentificare Supabase în localStorage
    return `sb.${projectRef}.auth-token`;
  } catch (error) {
    console.error(
      "Eșuat parsarea URL-ului Supabase pentru cheia de stocare:",
      error
    );
    return null;
  }
};

export default function Login() {
  // Form state management
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [rememberMe, setRememberMe] = useState(true); // State for remember me

  const router = useRouter();
  const { isAuthenticated, profileComplete, loading: authLoading } = useAuth();

  useEffect(() => {
    const savedEmails = localStorage.getItem(SUGGESTION_KEY);
    if (savedEmails) {
      try {
        setEmailSuggestions(JSON.parse(savedEmails));
      } catch (e) {
        console.error("Failed to parse saved emails", e);
        localStorage.removeItem(SUGGESTION_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(profileComplete ? "/dashboard" : "/complete-profile");
    }
  }, [isAuthenticated, profileComplete, authLoading, router]);

  const saveEmailToSuggestions = useCallback((email: string) => {
    setEmailSuggestions((prev) => {
      const updated = Array.from(new Set([email, ...prev])).slice(0, 10);
      localStorage.setItem(SUGGESTION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkProfileCompletion = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_study_config")
        .select("study_cycle_id")
        .eq("user_id", userId)
        .maybeSingle();
      return !!data?.study_cycle_id;
    } catch (error) {
      console.error("Profile check error:", error);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Dacă "Remember Me" NU este bifat, ștergeți sesiunea din localStorage.
      // Chiar dacă `persistSession: true` este setat la inițializarea clientului,
      // Supabase stochează token-ul imediat. Prin urmare, trebuie să-l ștergem manual
      // pentru a simula comportamentul "non-persistent".
      if (!rememberMe) {
        const authStorageKey = getSupabaseAuthLocalStorageKey();
        if (authStorageKey) {
          localStorage.removeItem(authStorageKey);
          console.log(
            `Sesiunea a fost ștearsă din localStorage: ${authStorageKey}`
          );
        } else {
          console.warn(
            "Nu s-a putut determina cheia de stocare Supabase. Sesiunea ar putea persista în mod neașteptat."
          );
        }
      }

      // Obțineți sesiunea curentă după autentificarea reușită
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session after login");

      const isComplete = await checkProfileCompletion(session.user.id);
      saveEmailToSuggestions(formData.email);

      router.replace(isComplete ? "/dashboard" : "/complete-profile");
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error)) return "Login failed";

    if (error.message.includes("Invalid API key")) {
      return "Configuration Error - Verify your environment variables";
    }

    if (error.message.includes("Invalid login credentials")) {
      return "Invalid email or password";
    }

    return error.message || "Login failed";
  };

  const filteredSuggestions = emailSuggestions
    .filter((suggestion) =>
      suggestion.toLowerCase().includes(formData.email.toLowerCase())
    )
    .slice(0, MAX_SUGGESTIONS);

  return (
    <div className="flex items-center justify-center px-4 bg-background transition-colors duration-300">
      <div className="w-full max-w-md space-y-6 border rounded-lg p-6 bg-card shadow-md">
        <div className="text-center space-y-2">
          <h2 className="font-orbitron text-3xl font-bold text-primary">
            LOGIN
          </h2>
          <p className="text-muted-foreground">Glad you&#39;re back!</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2" disabled={loading}>
            <FcGoogle className="h-5 w-5" />
            <span>Google</span>
          </Button>
          <Button variant="outline" className="gap-2" disabled={loading}>
            <FaApple className="h-5 w-5" />
            <span>Apple</span>
          </Button>
        </div>

        <Separator className="my-4" />

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-2 relative" ref={suggestionsRef}>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter your email"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                  {filteredSuggestions.map((suggestion) => (
                    <div
                      key={suggestion}
                      className="px-4 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, email: suggestion }));
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked: boolean) => setRememberMe(checked)}
              />
              <Label htmlFor="rememberMe">Remember me</Label>
            </div>

            <Button
              type="button"
              variant="link"
              className="text-sm text-primary px-0 h-auto"
              onClick={() => router.push("/forgot-password")}
            >
              Forgot password?
            </Button>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full",
              "bg-gradient-to-r from-blue-600 to-purple-600"
            )}
            disabled={loading}
          >
            {loading ? "Logging in..." : "LOGIN"}
          </Button>
        </form>
      </div>
    </div>
  );
}
