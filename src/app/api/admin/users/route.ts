import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const authHeader = req.headers.get("authorization");
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || "admin-secret";
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all users
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Error in users API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



