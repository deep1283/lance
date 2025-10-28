import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client (admin-only operations)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Creative = {
  id: string;
  competitor_id: string;
  post_type: string | null;
  caption: string | null;
  media_url: string | null;
  likes_count: number | null;
  views_count: number | null;
  comments_count: number | null;
  posted_at: string | null;
};

const STOPWORDS = new Set([
  "the",
  "is",
  "in",
  "at",
  "of",
  "a",
  "an",
  "and",
  "or",
  "to",
  "for",
  "with",
  "on",
  "this",
  "that",
  "it",
  "as",
  "by",
  "be",
  "are",
  "from",
  "you",
  "your",
  "our",
  "we",
  "they",
  "their",
  "them",
  "i",
  "me",
  "my",
  "us",
  "was",
  "were",
  "will",
  "can",
  "just",
  "more",
  "most",
  "very",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "not",
  "but",
  "if",
  "so",
  "than",
  "then",
  "there",
  "when",
  "what",
  "which",
  "who",
  "how",
]);

function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[a-zA-Z0-9_]+/g) || [];
  return matches.map((h) => h.toLowerCase());
}

function extractKeywords(caption: string): string[] {
  const cleaned = caption
    .replace(/#[a-zA-Z0-9_]+/g, " ") // remove hashtags
    .replace(/https?:\/\/\S+/g, " ") // remove urls
    .replace(/[^a-zA-Z0-9\s]/g, " ") // remove punctuation/emojis
    .toLowerCase();
  return cleaned
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w) && w.length > 2)
    .slice(0, 1000); // basic cap
}

function rank<T extends string>(items: T[]): { key: T; frequency: number }[] {
  const map = new Map<T, number>();
  for (const i of items) map.set(i, (map.get(i) || 0) + 1);
  return Array.from(map.entries())
    .map(([key, frequency]) => ({ key, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, startDate } = body as {
      userId?: string;
      startDate?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Determine 7-day window - look at the LAST 7 days (weekly analysis)
    const end = startDate ? new Date(startDate) : new Date();

    // normalize end to UTC date without time
    const endUTC = new Date(
      Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
    );
    const startUTC = new Date(endUTC);
    startUTC.setDate(startUTC.getDate() - 7);

    // Get user's competitors
    const { data: userCompetitors, error: ucError } = await supabase
      .from("user_competitors")
      .select("competitor_id")
      .eq("user_id", userId);
    if (ucError) {
      return NextResponse.json({ error: ucError.message }, { status: 500 });
    }

    const competitorIds = (userCompetitors || []).map((uc) => uc.competitor_id);

    if (competitorIds.length === 0) {
      return NextResponse.json(
        { error: "No competitors for user" },
        { status: 400 }
      );
    }

    // Fetch creatives in window
    const { data: creatives, error: crError } = await supabase
      .from("competitor_creatives")
      .select(
        "id, competitor_id, post_type, caption, media_url, likes_count, views_count, comments_count, posted_at"
      )
      .in("competitor_id", competitorIds)
      .gte("posted_at", startUTC.toISOString())
      .lt("posted_at", endUTC.toISOString());
    if (crError) {
      return NextResponse.json({ error: crError.message }, { status: 500 });
    }

    const allCreatives: Creative[] = creatives || [];

    // Extract hashtags & keywords from captions
    const allHashtags: string[] = [];
    const allKeywords: string[] = [];
    for (const c of allCreatives) {
      const caption = c.caption || "";
      allHashtags.push(...extractHashtags(caption));
      allKeywords.push(...extractKeywords(caption));
    }

    const rankedHashtags = rank(allHashtags)
      .slice(0, 10)
      .map((r) => ({ tag: r.key, frequency: r.frequency }));
    const rankedKeywords = rank(allKeywords)
      .slice(0, 20)
      .map((r) => ({ term: r.key, frequency: r.frequency }));

    // Top creatives by engagement
    const scored = allCreatives
      .map((c) => ({
        creative: c,
        engagement:
          (c.likes_count || 0) +
          (c.comments_count || 0) +
          (c.post_type === "reel" ? c.views_count || 0 : 0),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)
      .map(({ creative }) => ({
        competitor_id: creative.competitor_id,
        post_id: creative.id,
        post_type: creative.post_type,
        caption: creative.caption,
        media_url: creative.media_url,
      }));

    // Insert a new row (keep history by date window)
    const { error: insertError } = await supabase
      .from("strategy_competitors")
      .insert({
        user_id: userId,
        start_date: startUTC.toISOString().slice(0, 10),
        end_date: endUTC.toISOString().slice(0, 10),
        top_hashtags: rankedHashtags,
        top_keywords: rankedKeywords,
        top_creatives: scored,
      });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("strategy-competitors refresh error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
