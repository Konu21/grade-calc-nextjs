// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth callback or email verification
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Check if the user's email is verified
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && user.email_confirmed_at) {
          // Check if profile is complete
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            router.push("/dashboard");
          } else {
            router.push("/complete-profile");
          }
        }
      }
    });

    // For email verification links
    const handleEmailVerification = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Error verifying email:", error);
        router.push("/login?error=verification_failed");
        return;
      }

      if (data?.session) {
        // Check if profile is complete
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        if (profile) {
          router.push("/dashboard");
        } else {
          router.push("/complete-profile");
        }
      }
    };

    handleEmailVerification();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Verifying your account</h1>
        <p className="text-muted-foreground">
          Please wait while we verify your email and log you in...
        </p>
      </div>
    </div>
  );
}
