// app/signup/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, User, ChevronRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Load saved emails from localStorage
  useEffect(() => {
    const savedEmails = localStorage.getItem("emailSuggestions");
    if (savedEmails) {
      setEmailSuggestions(JSON.parse(savedEmails));
    }
  }, []);

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

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Save the email to suggestions after successful registration
      saveEmailToSuggestions(email);

      if (data) {
        router.push(`/verify-email?email=${email}`);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: "google" | "apple") => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
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
            SIGN UP
          </h2>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleOAuthSignUp("google")}
            disabled={loading}
          >
            <FcGoogle className="h-5 w-5" />
            <span>Google</span>
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleOAuthSignUp("apple")}
            disabled={loading}
          >
            <FaApple className="h-5 w-5" />
            <span>Apple</span>
          </Button>
        </div>

        <div className="relative">
          <Separator className="my-4" />
          <div className="absolute left-1/2 -translate-x-1/2 -top-3 px-2 bg-card text-sm text-muted-foreground">
            Or continue with email
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSignUp}>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="name"
                type="text"
                required
                className="pl-10"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 relative" ref={suggestionsRef}>
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="email"
                type="email"
                required
                className="pl-10"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
            </div>
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="password"
                type="password"
                required
                className="pl-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="confirm-password"
                type="password"
                required
                className="pl-10"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className={cn(
              "font-orbitron w-full text-lg font-bold",
              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            )}
            disabled={loading}
          >
            {loading ? "Creating account..." : "SIGN UP"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center"
            >
              Login <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </p>
        </div>

        <div className="pt-6 border-t flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms & Conditions
          </Link>
          <Link
            href="/support"
            className="hover:text-primary transition-colors"
          >
            Support
          </Link>
          <Link
            href="/contact"
            className="hover:text-primary transition-colors"
          >
            Customer Care
          </Link>
        </div>
      </div>
    </div>
  );
}
