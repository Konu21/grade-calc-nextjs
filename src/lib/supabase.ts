// lib/supabase/supabase.ts
import { createClient } from "@supabase/supabase-js";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  throw new Error(`
    Missing Supabase configuration!
    URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "Exists" : "Missing"}
    Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Exists" : "Missing"}
  `);
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
