import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Missing Supabase environment variables. " +
    "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
    "are set in your .env.local file. " +
    "See SETUP_INSTRUCTIONS.md for details."
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(
    `❌ Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}`
  );
}

// Singleton pattern - ensures only one Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get the browser Supabase client instance
 * Uses standard createClient for reliability
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance && typeof window !== 'undefined') {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance!;
};

// Export the singleton instance for backward compatibility
// Only create instance in browser environment
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null as unknown as SupabaseClient;

// Export types for use throughout the app
export type Database = any; // Replace with your generated types from Supabase CLI
