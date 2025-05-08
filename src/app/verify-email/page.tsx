"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  // Optional: Resend verification email functionality
  const handleResendEmail = async () => {
    // You would need to implement this function in your auth service
    console.log("Resend email to:", email);
    // Example: await supabase.auth.resendVerificationEmail({ email });
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
              className="w-full"
            >
              Resend verification email
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
