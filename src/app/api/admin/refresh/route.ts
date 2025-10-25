import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { competitorId, analysisType, userId } = body;

    if (!competitorId || !analysisType || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For competitive intelligence, get competitors for this user
    let prompt = "";
    let systemPrompt = "";

    if (analysisType === "competitive_intelligence") {
      // Get all competitors for this user
      const { data: userCompetitors } = await supabase
        .from("user_competitors")
        .select(
          `
          competitor_id,
          competitors (
            id,
            name,
            industry
          )
        `
        )
        .eq("user_id", userId);

      const competitorIds =
        userCompetitors?.map((uc) => uc.competitor_id) || [];

      // Get aggregated data for ALL competitors
      const { data: allAds } = await supabase
        .from("competitor_ads")
        .select("*")
        .in("competitor_id", competitorIds)
        .eq("is_active", true);

      const { data: allCreatives } = await supabase
        .from("competitor_creatives")
        .select("*")
        .in("competitor_id", competitorIds);

      const { data: allTopPosts } = await supabase
        .from("competitor_top_posts")
        .select("*")
        .in("competitor_id", competitorIds);

      // Get user profile for niche context
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      systemPrompt = `You are a data-driven social media marketing expert with 20+ years of professional experience, specialized in the jewelry and fashion accessories industry. You have deep expertise in Instagram and Facebook marketing, both organic growth and paid advertising, for B2B jewelry wholesalers and manufacturers (especially gold-plated jewelry).`;

      prompt = `
OBJECTIVE:
Help you plan, execute, and analyze social media strategies for a wholesale gold-plated jewelry brand (not retail). My recommendations are based on proven data, platform reports, and performance benchmarks. I avoid guesses, speculation, or vague advice. I include numbers, benchmarks, metrics, or case-study references wherever possible.

USER'S NICHE: ${userProfile?.niche || "Jewelry wholesale"}

COMPREHENSIVE MARKET DATA:
- Total Competitors: ${userCompetitors?.length || 0}
- Total Active Paid Ads: ${allAds?.length || 0}
- Total Organic Posts: ${allCreatives?.length || 0}
- Total Viral Posts: ${allTopPosts?.length || 0}
`;
    }

    // Generate AI analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const analysisContent = completion.choices[0]?.message?.content || "";

    // Save to database with upsert to handle duplicates
    const { error: insertError } = await supabase.from("ai_analyses").upsert(
      {
        competitor_id: competitorId,
        user_id: userId,
        analysis_type: analysisType,
        content: analysisContent,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "competitor_id,analysis_type",
      }
    );

    if (insertError) {
      console.error("Error inserting analysis:", insertError);
      return NextResponse.json(
        { error: "Failed to save analysis: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin refresh API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
