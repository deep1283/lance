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
    const { competitorId, analysisType, userId, retrieveOnly } = body;

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
    let cacheQueryCompetitorId = competitorId;
    if (analysisType === "competitive_intelligence") {
      // Get the first competitor for this user to use for cache lookup
      const { data: userCompetitors } = await supabase
        .from("user_competitors")
        .select("competitor_id")
        .eq("user_id", user.id)
        .limit(1);

      if (userCompetitors && userCompetitors.length > 0) {
        cacheQueryCompetitorId = userCompetitors[0].competitor_id;
      }
    }

    // First, let's see what's actually in the database
    const { data: allAnalyses, error: allAnalysesError } = await supabase
      .from("ai_analyses")
      .select("*")
      .eq("user_id", user.id);

    console.log("🔍 All analyses in database for user:", allAnalyses);

    const { data: cached, error: cacheError } = await supabase
      .from("ai_analyses")
      .select("*")
      .eq("competitor_id", cacheQueryCompetitorId)
      .eq("analysis_type", analysisType)
      .eq("user_id", user.id)
      .maybeSingle();

    if (cacheError) console.error("Supabase cache error:", cacheError);

    console.log("🔍 Cache check:", {
      requestedParams: {
        competitorId,
        analysisType,
        userId: user.id,
        cacheQueryCompetitorId,
      },
      cached: !!cached,
      cachedData: cached
        ? {
            id: cached.id,
            competitor_id: cached.competitor_id,
            analysis_type: cached.analysis_type,
            user_id: cached.user_id,
            created_at: cached.created_at,
            content_length: cached.content?.length || 0,
          }
        : null,
      retrieveOnly,
    });

    const isFresh =
      cached &&
      new Date().getTime() - new Date(cached.created_at).getTime() <
        2 * 24 * 60 * 60 * 1000;

    console.log("🔍 Freshness check:", {
      isFresh,
      timeDiff: cached
        ? new Date().getTime() - new Date(cached.created_at).getTime()
        : null,
      twoDaysInMs: 2 * 24 * 60 * 60 * 1000,
    });

    if (isFresh) {
      console.log("✅ Returning cached AI analysis");
      return Response.json({ analysis: cached.content });
    }

    // If retrieveOnly is true, don't generate new analysis
    if (retrieveOnly) {
      console.log("⚠️ No fresh analysis available and retrieveOnly=true");
      return Response.json({
        analysis: "Analysis is being updated. Please check back later.",
      });
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

TONE & STYLE:
- Speak like a senior marketing strategist advising a brand founder
- Be confident, factual, and concise — no fluff or motivational language
- When uncertain due to lack of data, explicitly say "data not available" instead of guessing
- When providing strategies, include rationale + expected outcome metrics
- Always use actual competitor names instead of "Competitor A" or "Competitor B"
- Address you as "you" instead of "your wholesaler"

OUTPUT STRUCTURE:
1. Competitive Landscape Analysis (analyze each competitor's position and strategy)
2. Market Positioning Insights (who's leading, gaps, opportunities)
3. Niche-Specific Recommendations (tailored to jewelry wholesale industry)
4. Data-Driven Strategy (with benchmarks and metrics)
5. 30-Day Implementation Plan (specific action steps)

ANALYSIS APPROACH:
- First, analyze each competitor's current position based on their actual data
- Identify market leaders, followers, and gaps in the landscape
- Then provide niche-specific suggestions for the jewelry wholesale industry
- Base all recommendations on the actual competitor data provided
- Focus on maximizing engagement, DMs, and inquiries from retailers, not end consumers
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
OBJECTIVE:
Analyze ${
        competitor?.name || "this competitor"
      }'s paid advertising strategy to identify opportunities for you to outperform them and areas where you can learn from their approach.

COMPETITOR DATA:
${JSON.stringify(ads, null, 2)}

ANALYSIS APPROACH:
- Identify ${
        competitor?.name || "this competitor"
      }'s weaknesses that you can exploit
- Highlight their strengths that you should learn from
- Focus on how YOU can outperform them, not how to help them improve
- Be critical and analytical, not promotional of the competitor

Provide insights in this EXACT format:

### Competitive Analysis: ${
        competitor?.name || "this competitor"
      }'s Paid Ads Strategy

1. Campaign Strategy Analysis:
[Analyze their messaging approach - identify gaps and weaknesses you can exploit, and strengths you should adopt]

2. Creative Performance Review:
[Evaluate their visual content - point out what's missing or poorly executed that you can do better, and what works that you should replicate]

3. Targeting & Platform Gaps:
[Identify their targeting weaknesses and platform limitations that give you competitive advantages]

4. Performance Weaknesses:
[Highlight their ad performance issues, timing problems, and optimization failures that you can avoid]

5. Your Competitive Advantages:
[Specific strategies for how YOU can outperform them based on their weaknesses and gaps]

TONE:
- Be critical and analytical of the competitor
- Focus on YOUR opportunities to win
- Address the user as "you" 
- Don't praise the competitor unnecessarily
- Highlight their failures and your opportunities
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
OBJECTIVE:
Analyze ${
        competitor?.name || "this competitor"
      }'s organic social media strategy to identify opportunities for you to outperform them and areas where you can learn from their approach.

CURRENT STRATEGY (Recent Posts):
${JSON.stringify(creatives || [], null, 2)}

PROVEN WINNERS (Viral Posts - Top Performing Content):
${JSON.stringify(topPosts || [], null, 2)}

ANALYSIS APPROACH:
- Identify ${
        competitor?.name || "this competitor"
      }'s content weaknesses that you can exploit
- Highlight their strengths that you should learn from and replicate
- Focus on how YOU can outperform them, not how to help them improve
- Be critical and analytical, not promotional of the competitor

Provide insights in this EXACT format:

### Competitive Analysis: ${
        competitor?.name || "this competitor"
      }'s Organic Social Strategy

Content Strategy Analysis:
[Analyze their content themes and messaging - identify gaps and weaknesses you can exploit, and strengths you should adopt]

Engagement Performance Review:
[Evaluate their engagement patterns - point out what's missing or poorly executed that you can do better, and what works that you should replicate]

Posting Strategy Gaps:
[Identify their posting frequency issues, timing problems, and consistency failures that give you competitive advantages]

Viral Content Opportunities:
[Highlight what they're missing in their viral content strategy and what successful elements you should replicate]

Your Content Advantages:
[Specific strategies for how YOU can outperform them based on their content weaknesses and gaps]

TONE:
- Be critical and analytical of the competitor
- Focus on YOUR opportunities to win
- Address the user as "you" 
- Don't praise the competitor unnecessarily
- Highlight their failures and your opportunities
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
    // For competitive_intelligence, we'll use the first competitor ID as a placeholder
    let saveCompetitorId = competitorId;
    if (analysisType === "competitive_intelligence") {
      // Get the first competitor for this user to use as a placeholder
      const { data: userCompetitors } = await supabase
        .from("user_competitors")
        .select("competitor_id")
        .eq("user_id", user.id)
        .limit(1);

      if (userCompetitors && userCompetitors.length > 0) {
        saveCompetitorId = userCompetitors[0].competitor_id;
      } else {
        // If no competitors, we can't save competitive intelligence analysis
        console.error(
          "❌ No competitors found for user, cannot save competitive intelligence analysis"
        );
        return Response.json({ analysis });
      }
    }

    const upsertData = {
      competitor_id: saveCompetitorId,
      analysis_type: analysisType,
      content: analysis,
      user_id: user.id,
      expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log("💾 Saving analysis to database:", {
      upsertData,
      originalParams: {
        competitorId,
        analysisType,
        userId: user.id,
      },
    });

    const { error: upsertError } = await supabase
      .from("ai_analyses")
      .upsert(upsertData);

    if (upsertError) {
      console.error("❌ Cache upsert error:", upsertError);
    } else {
      console.log("✅ Analysis saved to database successfully");
    }

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
