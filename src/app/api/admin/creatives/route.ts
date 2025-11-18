import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (
    !process.env.NEXT_PUBLIC_ADMIN_SECRET ||
    token !== process.env.NEXT_PUBLIC_ADMIN_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("competitor_creatives")
    .select("competitor_id, posted_at, competitors(name)");

  if (error) {
    console.error("Error fetching competitor creatives:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitor creatives" },
      { status: 500 }
    );
  }

  type CreativeRow = {
    competitor_id: string;
    posted_at: string | null;
    competitors?: { name?: string | null } | null;
  };

  const summaries = new Map<
    string,
    { competitorId: string; name: string; count: number; latestPostedAt: string }
  >();

  ((data || []) as CreativeRow[]).forEach((row) => {
    const id = row.competitor_id;
    const name = row.competitors?.name || "Unknown";
    const postedAt = row.posted_at || "";

    if (!summaries.has(id)) {
      summaries.set(id, {
        competitorId: id,
        name,
        count: 0,
        latestPostedAt: postedAt,
      });
    }

    const current = summaries.get(id)!;
    current.count += 1;
    if (
      postedAt &&
      (!current.latestPostedAt ||
        new Date(postedAt).getTime() > new Date(current.latestPostedAt).getTime())
    ) {
      current.latestPostedAt = postedAt;
    }
  });

  return NextResponse.json({ competitors: Array.from(summaries.values()) });
}
