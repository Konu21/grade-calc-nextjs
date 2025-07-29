"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

const COOLDOWN_TIME = 60; // 60 seconds cooldown

const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (cooldown > 0) {
        setCooldown((time) => time - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "No email address found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    if (cooldown > 0) {
      toast({
        title: "Please wait",
        description: `You can resend the email in ${cooldown} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        if (error.message.includes("Too many requests")) {
          toast({
            title: "Too many attempts",
            description: "Please wait a few minutes before trying again.",
            variant: "destructive",
          });
          setCooldown(COOLDOWN_TIME);
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description:
          "Verification email has been resent. Please check your inbox.",
      });
      setCooldown(COOLDOWN_TIME);
    } catch {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 border rounded-lg p-6 bg-card shadow-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <MailCheck className="h-6 w-6 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a verification link to{" "}
            <span className="font-semibold text-primary">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or click below
            to resend.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className="w-full"
            >
              {isResending
                ? "Sending..."
                : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : "Resend verification email"}
            </Button>
            <Button asChild variant="link">
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmail />
    </Suspense>
  );
}
