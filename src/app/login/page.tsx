// app/login/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { isAuthenticated, profileComplete, loading: authLoading } = useAuth();

  // Load saved emails from localStorage
  useEffect(() => {
    const savedEmails = localStorage.getItem("emailSuggestions");
    if (savedEmails) {
      setEmailSuggestions(JSON.parse(savedEmails));
    }
  }, []);
  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (!profileComplete) {
        router.push("/complete-profile");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, profileComplete, authLoading, router]);
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  // Save email to suggestions
  const saveEmailToSuggestions = (email: string) => {
    const updatedSuggestions = Array.from(
      new Set([email, ...emailSuggestions])
    );
    setEmailSuggestions(updatedSuggestions);
    localStorage.setItem(
      "emailSuggestions",
      JSON.stringify(updatedSuggestions)
    );
  };

  // Handle click outside suggestions
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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Login attempt with:", { email });
      console.log("Supabase client:", supabase);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login response:", { data, error });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error("No session returned");
      }

      saveEmailToSuggestions(email);
      router.push(profileComplete ? "/dashboard" : "/complete-profile");
    } catch (error: unknown) {
      console.error("Full error details:", error);

      let errorMessage = "Login failed";
      if (error instanceof Error && error.message.includes("Invalid API key")) {
        errorMessage = `
          Configuration Error - Verify:
          1. .env.local has correct values
          2. Server was restarted
          3. No typos in variables
        `;
      } else if (
        error instanceof Error &&
        error.message.includes("Invalid login credentials")
      ) {
        errorMessage = "Invalid email or password";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = emailSuggestions
    .filter((suggestion) =>
      suggestion.toLowerCase().includes(email.toLowerCase())
    )
    .slice(0, 5); // Show max 5 suggestions

  return (
    <div className="flex items-center justify-center px-4 bg-background transition-colors duration-300 ">
      <div className="w-full max-w-md space-y-6 border rounded-lg p-6 bg-card shadow-md">
        <div className="text-center space-y-2">
          <h2 className="font-orbitron text-3xl font-bold text-primary">
            LOGIN
          </h2>
          <p className="text-muted-foreground">Glad you&apos;re back!</p>
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

        <div className="relative">
          <Separator className="my-4" />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-2 relative" ref={suggestionsRef}>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter your email"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setEmail(suggestion);
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
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="text-sm font-normal">
                  Remember me
                </Label>
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
