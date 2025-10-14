/**
 * Background AI Analysis Refresh System
 *
 * This system automatically refreshes AI analysis every 2 days
 * without requiring user interaction or page refreshes.
 */

import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RefreshJob {
  competitorId: string;
  userId: string;
  analysisType: string;
  lastRefreshed: string;
}

/**
 * Check if analysis needs refresh (older than 2 days)
 */
function needsRefresh(lastRefreshed: string): boolean {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  return new Date(lastRefreshed) < twoDaysAgo;
}

/**
 * Get all analyses that need refresh
 */
async function getAnalysesNeedingRefresh(): Promise<RefreshJob[]> {
  const { data: analyses, error } = await supabase
    .from("ai_analyses")
    .select("competitor_id, user_id, analysis_type, created_at")
    .lt(
      "created_at",
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    );

  if (error) {
    console.error("Error fetching analyses needing refresh:", error);
    return [];
  }

  return (
    analyses?.map((analysis) => ({
      competitorId: analysis.competitor_id,
      userId: analysis.user_id,
      analysisType: analysis.analysis_type,
      lastRefreshed: analysis.created_at,
    })) || []
  );
}

/**
 * Refresh a single analysis
 */
async function refreshAnalysis(job: RefreshJob): Promise<boolean> {
  try {
    console.log(
      `🔄 Refreshing analysis: ${job.analysisType} for competitor ${job.competitorId}`
    );

    // Call the AI API to generate new analysis
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use internal API secret for background refresh
          "X-Internal-API-Secret":
            process.env.INTERNAL_API_SECRET || "internal-secret",
        },
        body: JSON.stringify({
          competitorId: job.competitorId,
          analysisType: job.analysisType,
          userId: job.userId,
        }),
      }
    );

    if (!response.ok) {
      console.error(`Failed to refresh analysis: ${response.status}`);
      return false;
    }

    console.log(`✅ Successfully refreshed analysis: ${job.analysisType}`);
    return true;
  } catch (error) {
    console.error(`Error refreshing analysis:`, error);
    return false;
  }
}

/**
 * Main background refresh function
 * This should be called periodically (e.g., every hour)
 */
export async function runBackgroundRefresh(): Promise<void> {
  try {
    console.log("🔄 Starting background AI analysis refresh...");

    const jobs = await getAnalysesNeedingRefresh();
    console.log(`Found ${jobs.length} analyses needing refresh`);

    if (jobs.length === 0) {
      console.log("✅ No analyses need refresh");
      return;
    }

    // Process jobs in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);

      // Process batch in parallel
      const promises = batch.map((job) => refreshAnalysis(job));
      await Promise.allSettled(promises);

      // Wait between batches to respect rate limits
      if (i + batchSize < jobs.length) {
        console.log("⏳ Waiting 30 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }

    console.log("✅ Background refresh completed");
  } catch (error) {
    console.error("Error in background refresh:", error);
  }
}

/**
 * Start the background refresh scheduler
 * This should be called once when the app starts
 */
export function startBackgroundRefreshScheduler(): void {
  // Run immediately
  runBackgroundRefresh();

  // Then run every hour
  setInterval(() => {
    runBackgroundRefresh();
  }, 60 * 60 * 1000); // 1 hour

  console.log("🚀 Background AI refresh scheduler started");
}
