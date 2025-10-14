import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

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

    if (!competitorId || !analysisType) {
      return Response.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if this is an internal API call (background refresh)
    const internalSecret = req.headers.get("x-internal-api-secret");
    let user;

    if (internalSecret === process.env.INTERNAL_API_SECRET) {
      // Internal API call - get user from request body
      if (!userId) {
        return Response.json(
          { error: "Missing userId for internal call" },
          { status: 400 }
        );
      }

      // Get user from database
      const { data: userData, error: userError } = await supabase
        .from("auth.users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      user = userData;
    } else {
      // Regular API call - get user from auth header
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !authUser) {
        return Response.json({ error: "Invalid token" }, { status: 401 });
      }

      user = authUser;
    }

    // For competitive intelligence, we use user ID instead of competitor ID
    if (analysisType === "competitive_intelligence") {
      if (competitorId !== user.id) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    } else {
      // For other analysis types, verify user has access to this competitor
      const { data: userCompetitor } = await supabase
        .from("user_competitors")
        .select("competitor_id")
        .eq("user_id", user.id)
        .eq("competitor_id", competitorId)
        .single();

      if (!userCompetitor) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // 1️⃣ Check if cached analysis exists and is < 2 days old
    const { data: cached, error: cacheError } = await supabase
      .from("ai_analyses")
      .select("*")
      .eq(
        "competitor_id",
        analysisType === "competitive_intelligence" ? user.id : competitorId
      )
      .eq("analysis_type", analysisType)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cacheError) console.error("Supabase cache error:", cacheError);

    const isFresh =
      cached &&
      new Date().getTime() - new Date(cached.created_at).getTime() <
        2 * 24 * 60 * 60 * 1000;

    if (isFresh) {
      console.log("✅ Returning cached AI analysis");
      return Response.json({ analysis: cached.content });
    }

    // 2️⃣ Build prompt dynamically based on analysis type
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
        .eq("user_id", user.id);

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
        .eq("user_id", user.id)
        .single();

      systemPrompt = `You are a MASTER SOCIAL MEDIA MARKETER and INSTAGRAM GENIUS with 10+ years of experience in the ${
        userProfile?.industry || "jewelry"
      } market, specializing in ${userProfile?.niche || "jewelry"} businesses.`;

      prompt = `
Analyze the competitive landscape for this jewelry wholesaler. Provide strategic insights based on ALL competitor data.

COMPREHENSIVE MARKET DATA:
- Total Competitors: ${userCompetitors?.length || 0}
- Total Active Paid Ads: ${allAds?.length || 0}
- Total Organic Posts: ${allCreatives?.length || 0}
- Total Viral Posts: ${allTopPosts?.length || 0}

COMPETITOR BREAKDOWN:
${JSON.stringify(
  userCompetitors?.map(
    (uc: {
      competitors: { name: string; industry: string }[];
      competitor_id: string;
    }) => ({
      name: uc.competitors?.[0]?.name,
      industry: uc.competitors?.[0]?.industry,
      ads:
        allAds?.filter((ad) => ad.competitor_id === uc.competitor_id).length ||
        0,
      organic:
        allCreatives?.filter((c) => c.competitor_id === uc.competitor_id)
          .length || 0,
      viral:
        allTopPosts?.filter((p) => p.competitor_id === uc.competitor_id)
          .length || 0,
    })
  ),
  null,
  2
)}

SAMPLE DATA:
Paid Ads: ${JSON.stringify(allAds?.slice(0, 3), null, 2)}
Organic Posts: ${JSON.stringify(allCreatives?.slice(0, 3), null, 2)}
Viral Posts: ${JSON.stringify(allTopPosts?.slice(0, 3), null, 2)}

Provide a comprehensive market analysis with:
1. Market dominance strategy
2. Social media mastery insights
3. Growth acceleration tactics
4. Niche-specific recommendations
5. Immediate action plan

Be authoritative, data-driven, and provide insights that only a master marketer would know.
`;
    } else if (analysisType === "paid_ads_analysis") {
      const { data: ads } = await supabase
        .from("competitor_ads")
        .select("*")
        .eq("competitor_id", competitorId);

      const { data: competitor } = await supabase
        .from("competitors")
        .select("name")
        .eq("id", competitorId)
        .single();

      systemPrompt =
        "You are an expert online marketer specializing in jewelry advertising. Analyze paid ad strategies with actionable insights.";

      if (!ads || ads.length === 0) {
        return Response.json({
          analysis: `No paid ads running currently for ${
            competitor?.name || "this competitor"
          }. No analysis can be provided without actual ad data.`,
        });
      }

      prompt = `
Analyze the paid advertising strategy for ${
        competitor?.name || "this competitor"
      } in the jewelry market.

COMPETITOR DATA:
${JSON.stringify(ads, null, 2)}

Provide insights on:
1. Campaign strategy and messaging approach
2. Visual and creative trends
3. Platform usage and targeting
4. Call-to-action effectiveness
5. Seasonal or promotional patterns
6. Recommendations for improvement

Focus on actionable insights from the real data provided.
`;
    } else if (analysisType === "organic_content_analysis") {
      const { data: creatives } = await supabase
        .from("competitor_creatives")
        .select("*")
        .eq("competitor_id", competitorId);

      const { data: topPosts } = await supabase
        .from("competitor_top_posts")
        .select("*")
        .eq("competitor_id", competitorId);

      const { data: competitor } = await supabase
        .from("competitors")
        .select("name")
        .eq("id", competitorId)
        .single();

      systemPrompt =
        "You are an Instagram genius specializing in jewelry social media marketing. Analyze organic content strategies.";

      if (
        (!creatives || creatives.length === 0) &&
        (!topPosts || topPosts.length === 0)
      ) {
        return Response.json({
          analysis: `No organic content data available for ${
            competitor?.name || "this competitor"
          }. No analysis can be provided without actual content data.`,
        });
      }

      prompt = `
Analyze the organic social media strategy for ${
        competitor?.name || "this competitor"
      } in the jewelry market.

CURRENT STRATEGY (Recent Posts):
${JSON.stringify(creatives || [], null, 2)}

PROVEN WINNERS (Viral Posts - Top Performing Content):
${JSON.stringify(topPosts || [], null, 2)}

Analyze each section separately:

CURRENT STRATEGY INSIGHTS:
1. Recent content themes and messaging
2. Current engagement patterns
3. Recent posting frequency and timing
4. Current visual style and storytelling

PROVEN WINNERS INSIGHTS:
1. What content types perform best
2. Viral content themes and formats
3. High-performing engagement patterns
4. Replicable viral content ideas

Provide specific insights based on the real data provided.
`;
    } else if (analysisType === "viral_reels_analysis") {
      const { data: topPosts } = await supabase
        .from("competitor_top_posts")
        .select("*")
        .eq("competitor_id", competitorId);

      const { data: competitor } = await supabase
        .from("competitors")
        .select("name")
        .eq("id", competitorId)
        .single();

      systemPrompt =
        "You are an expert in viral content creation for jewelry brands. Analyze what makes content go viral.";

      if (!topPosts || topPosts.length === 0) {
        return Response.json({
          analysis: `No viral content data available for ${
            competitor?.name || "this competitor"
          }. No analysis can be provided without actual viral content data.`,
        });
      }

      prompt = `
Analyze the viral content strategy for ${
        competitor?.name || "this competitor"
      } in the jewelry market.

TOP PERFORMING CONTENT:
${JSON.stringify(topPosts, null, 2)}

Identify:
1. What makes their content go viral
2. Content themes and formats that work
3. Engagement patterns and audience response
4. Visual elements and storytelling techniques
5. Timing and posting strategies
6. Replicable viral content ideas

Provide specific insights based on the real data provided.
`;
    }

    // 3️⃣ Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const analysis = completion.choices[0].message.content;

    // 4️⃣ Save to Supabase (upsert cache)
    const { error: upsertError } = await supabase.from("ai_analyses").upsert(
      {
        competitor_id:
          analysisType === "competitive_intelligence" ? user.id : competitorId,
        analysis_type: analysisType,
        content: analysis,
        user_id: user.id,
        expires_at: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      { onConflict: "competitor_id,analysis_type,user_id" }
    );

    if (upsertError) console.error("Cache upsert error:", upsertError);

    // 5️⃣ Return the new AI analysis
    return Response.json({ analysis });
  } catch (error) {
    console.error("AI Route Error:", error);

    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes("429")) {
      return Response.json({
        analysis:
          "📊 **Analysis Available**\n\nCheck the charts and data above for insights. AI analysis will be available once rate limits reset.",
        error:
          "Rate limit exceeded. Please wait before requesting new analysis.",
      });
    }

    return Response.json(
      {
        analysis:
          "⚠️ AI analysis temporarily unavailable. Please try again later.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
