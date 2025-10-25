import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Create a Supabase client using the service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Add this to .env.local
    );

    const { data, error } = await supabaseAdmin
      .from("ai_analyses")
      .select("competitor_id, user_id, analysis_type, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching analyses:", error);
      return NextResponse.json(
        { error: "Failed to fetch analyses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ analyses: data });
  } catch (error) {
    console.error("Error in admin analyses API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
