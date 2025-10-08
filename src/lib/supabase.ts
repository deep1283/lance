import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn(
    "⚠️ Supabase URL or Anon Key is missing. Please check your .env.local file."
  );
  console.warn("📖 See SETUP_INSTRUCTIONS.md for detailed setup guide.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
