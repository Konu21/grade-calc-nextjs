// lib/supabase/supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_DB_URL;
const key = process.env.NEXT_PUBLIC_DB_ANON_KEY;

// Avoid throwing at import-time (breaks builds without envs). Use a safe fallback and warn in browser.
const effectiveUrl = url || "https://example.supabase.co"; // harmless placeholder for build
const effectiveKey = key || "public-anon-key";

if (!url || !key) {
  if (typeof window !== "undefined") {
    // Only warn in the browser to avoid noisy logs at build time
    console.warn("Missing Supabase configuration! Please set NEXT_PUBLIC_DB_URL and NEXT_PUBLIC_DB_ANON_KEY.");
  }
}

export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
