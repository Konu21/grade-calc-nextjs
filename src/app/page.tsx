"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Adaugă starea de încărcare
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false); // Sesiunea a fost verificată
      if (session) {
        router.push("/dashboard");
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session && !loading) {
        // Redirecționează doar dacă nu este încărcarea inițială
        router.push("/dashboard");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, loading]);

  if (loading) {
    return <div className="flex justify-center">Loading...</div>; // Afișează un indicator de încărcare
  }

  if (session) {
    return null; // Nu afișa nimic, redirecționarea a avut loc
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <h1 className="font-orbitron text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
        GRADE CALCULATOR
      </h1>
      <p className="text-gray-300 mb-8">
        The ultimate tool for academic success
      </p>
      {/* Additional content */}
    </div>
  );
}
