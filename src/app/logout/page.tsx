"use client";
// src/app/logout/page.tsx
import { useEffect } from "react";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Dezactivează complet prerendering-ul
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

export default function LogoutPage() {
  useEffect(() => {
    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        redirect("/login");
      } else {
        console.error("Logout error:", error);
        redirect("/error?message=logout_failed");
      }
    };

    handleLogout();
  }, []);
  return (
    <div className="grid min-h-screen place-items-center">
      <p className="text-lg">Logging out...</p>
    </div>
  );
}
