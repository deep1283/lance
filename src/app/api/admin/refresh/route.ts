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

type MediaRecord = {
  media_url?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  carousel_images?: string | null;
  [key: string]: unknown;
};

function sanitizeMediaRecords<T extends MediaRecord>(
  records?: T[] | null
): Array<Omit<T, "image_url" | "video_url" | "carousel_images"> & {
  media_url: string | null;
}> {
  if (!records) return [];
  return records.map((record) => {
    const {
      image_url,
      video_url,
      carousel_images,
      media_url,
      ...rest
    } = record;

    return {
      ...(rest as Omit<T, "image_url" | "video_url" | "carousel_images">),
      media_url:
        (media_url as string | null | undefined) ||
        (image_url as string | null | undefined) ||
        (video_url as string | null | undefined) ||
        (carousel_images as string | null | undefined) ||
        null,
    };
  });
}

async function getCompetitorIdsForUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_competitors")
    .select("competitor_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch competitors: ${error.message}`);
  }

  return (data || []).map((entry) => entry.competitor_id);
}

async function upsertAnalysis({
  competitorId,
  analysisType,
  content,
}: {
  competitorId: string;
  analysisType: string;
  content: string;
}) {
  const { error } = await supabase.from("ai_analyses").upsert(
    {
      competitor_id: competitorId,
      analysis_type: analysisType,
      content,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "competitor_id,analysis_type",
    }
  );

  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`);
  }
}

async function refreshPaidAdsAnalysisForCompetitor(
  competitorId: string
) {
  const { data: adsRaw } = await supabase
    .from("competitor_ads")
    .select("*")
    .eq("competitor_id", competitorId);
  const ads = sanitizeMediaRecords(adsRaw);

  const { data: competitor } = await supabase
    .from("competitors")
    .select("name")
    .eq("id", competitorId)
    .single();

  const competitorName = competitor?.name || "this competitor";

  if (!ads || ads.length === 0) {
    const content = `No paid ads running currently for ${competitorName}. No analysis can be provided without actual ad data.`;
    await upsertAnalysis({
      competitorId,
      analysisType: "paid_ads_analysis",
      content,
    });
    return { competitorId, status: "no_data" as const };
  }

  const systemPrompt =
    "You are an expert online marketer specializing in jewelry advertising. Analyze paid ad strategies with actionable insights.";

  const prompt = `
OBJECTIVE:
Analyze ${competitorName}'s paid advertising strategy to identify opportunities for you to outperform them and areas where you can learn from their approach.

COMPETITOR DATA:
${JSON.stringify(ads, null, 2)}

ANALYSIS APPROACH:
- Identify ${competitorName}'s weaknesses that you can exploit
- Highlight their strengths that you should learn from
- Focus on how YOU can outperform them, not how to help them improve
- Be critical and analytical, not promotional of the competitor

Provide insights in this EXACT format:

### Competitive Analysis: ${competitorName}'s Paid Ads Strategy

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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content || "";

  await upsertAnalysis({
    competitorId,
    analysisType: "paid_ads_analysis",
    content,
  });

  return { competitorId, status: "updated" as const };
}

async function refreshOrganicAnalysisForCompetitor(
  competitorId: string
) {
  const { data: creativesRaw } = await supabase
    .from("competitor_creatives")
    .select("*")
    .eq("competitor_id", competitorId);
  const creatives = sanitizeMediaRecords(creativesRaw);

  const { data: competitor } = await supabase
    .from("competitors")
    .select("name")
    .eq("id", competitorId)
    .single();

  const competitorName = competitor?.name || "this competitor";

  if (!creatives || creatives.length === 0) {
    const content = `No organic content found for ${competitorName}.`;
    await upsertAnalysis({
      competitorId,
      analysisType: "organic_content_analysis",
      content,
    });
    return { competitorId, status: "no_data" as const };
  }

  const systemPrompt = `
You are a senior social strategist for jewelry wholesalers. 
Describe the competitor strictly in third-person using their name (${competitorName}); 
reserve the word "you" only when giving advice to our client about actions they can take. 
Always connect each insight to how our client can copy or beat the competitor.`;

  const prompt = `
Analyze ${competitorName}'s organic content performance using the dataset below.

ORGANIC CONTENT DATA:
${JSON.stringify(creatives, null, 2)}

Report back with the following structure (use markdown):

### 1. Competitor Content Strategy
- Summarize ${competitorName}'s overarching content themes in third-person.
- **Strengths (3 bullets):** What ${competitorName} is executing well.
- **Weaknesses (3 bullets):** Clear gaps or mistakes they make.
- **How You Capitalize:** 2-3 bullets that explain how our client can either copy what works or exploit the weaknesses.

### 2. Engagement Diagnostics
- Reference concrete numbers from the data (likes, comments, views, posting cadence) to highlight patterns.
- Close with a short "What to Borrow vs. Beat" list that speaks to the user directly.

### 3. Hook, Visual & Caption Playbook
- Detail the hooks, visuals, or caption formulas ${competitorName} uses.
- Include an "Actionable Swipe File" subsection with bullet ideas the user can test.

Rules:
- Refer to ${competitorName} in third-person (they/their) at all times.
- Use "you" only when suggesting what the client should do.
- Keep every recommendation data-driven and tied to the supplied dataset.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content || "";

  await upsertAnalysis({
    competitorId,
    analysisType: "organic_content_analysis",
    content,
  });

  return { competitorId, status: "updated" as const };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { competitorId, analysisType, userId } = body;

    if (!analysisType) {
      return NextResponse.json(
        { error: "analysisType is required" },
        { status: 400 }
      );
    }

    // Validation per type
    if (analysisType === "competitive_intelligence") {
      if (!userId || !competitorId) {
        return NextResponse.json(
          { error: "userId and competitorId are required for competitive_intelligence" },
          { status: 400 }
        );
      }
    } else {
      // For paid/organic allow either userId (refresh all for the user) or a single competitorId fallback
      if (!userId && !competitorId) {
        return NextResponse.json(
          { error: "userId or competitorId is required for this analysis type" },
          { status: 400 }
        );
      }
    }

    // If a userId is provided, validate it (used for multi-competitor refresh)
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Refresh paid ads or organic analyses for all competitors
    if (
      analysisType === "paid_ads_analysis" ||
      analysisType === "organic_content_analysis"
    ) {
      // Determine which competitors to refresh
      let competitorIds: string[] = [];

      if (userId) {
        competitorIds = await getCompetitorIdsForUser(userId);
        if (!competitorIds.length) {
          return NextResponse.json(
            { error: "No competitors found for this user" },
            { status: 404 }
          );
        }
      } else if (competitorId) {
        competitorIds = [competitorId];
      }

      const results: Array<{
        competitorId: string;
        status: "updated" | "no_data" | "failed";
        error?: string;
      }> = [];

      for (const targetCompetitorId of competitorIds) {
        try {
          const result =
            analysisType === "paid_ads_analysis"
              ? await refreshPaidAdsAnalysisForCompetitor(targetCompetitorId)
              : await refreshOrganicAnalysisForCompetitor(targetCompetitorId);
          results.push(result);
        } catch (err) {
          console.error(
            `Failed to refresh ${analysisType} for competitor ${targetCompetitorId}`,
            err
          );
          results.push({
            competitorId: targetCompetitorId,
            status: "failed",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      const refreshedCount = results.filter(
        (r) => r.status === "updated" || r.status === "no_data"
      ).length;

      return NextResponse.json({
        success: true,
        refreshed: refreshedCount,
        details: results,
      });
    }

    // For competitive intelligence (and other single-competitor ops), build prompt
    let prompt = "";
    let systemPrompt = "";
    let preGeneratedAnalysis: string | null = null;

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
      const { data: allAdsRaw } = await supabase
        .from("competitor_ads")
        .select("*")
        .in("competitor_id", competitorIds)
        .eq("is_active", true);

      const { data: allCreativesRaw } = await supabase
        .from("competitor_creatives")
        .select("*")
        .in("competitor_id", competitorIds);

      const { data: allTopPostsRaw } = await supabase
        .from("competitor_top_posts")
        .select("*")
        .in("competitor_id", competitorIds);
      const allAds = sanitizeMediaRecords(allAdsRaw);
      const allCreatives = sanitizeMediaRecords(allCreativesRaw);
      const allTopPosts = sanitizeMediaRecords(allTopPostsRaw);

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
    } else if (analysisType === "viral_reels_analysis") {
      const { data: topPostsRaw } = await supabase
        .from("competitor_top_posts")
        .select("*")
        .eq("competitor_id", competitorId);
      const topPosts = sanitizeMediaRecords(topPostsRaw);

      const { data: competitor } = await supabase
        .from("competitors")
        .select("name")
        .eq("id", competitorId)
        .single();

      if (!topPosts || topPosts.length === 0) {
        preGeneratedAnalysis = `No viral content data available for ${
          competitor?.name || "this competitor"
        }.`;
      } else {
        systemPrompt =
          "You are an expert in viral content creation for jewelry brands. Analyze what makes content go viral.";

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
    } else {
      return NextResponse.json(
        { error: "Unsupported analysis type" },
        { status: 400 }
      );
    }

    let analysisContent = preGeneratedAnalysis || "";

    // Generate AI analysis when we have data to analyze
    if (!analysisContent) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      analysisContent = completion.choices[0]?.message?.content || "";
    }

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
