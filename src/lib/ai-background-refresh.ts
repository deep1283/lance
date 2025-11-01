/**
 * Background AI Analysis Refresh System
 *
 * This system automatically refreshes AI analysis every 2 days
 * without requiring user interaction or page refreshes.
 */

// Import removed - supabase client not needed for current implementation

interface RefreshJob {
  competitorId: string;
  userId: string;
  analysisType: string;
  lastRefreshed: string;
}

/**
 * Get all analyses that need refresh
 */
async function getAnalysesNeedingRefresh(): Promise<RefreshJob[]> {
  // Since we removed the 2-day expiration, this function now returns empty array
  // Analyses will only be refreshed manually from the admin panel
  return [];
}

/**
 * Refresh a single analysis
 */
async function refreshAnalysis(job: RefreshJob): Promise<boolean> {
  try {
    // Refreshing analysis for competitor

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

    // Successfully refreshed analysis
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
    // Starting background AI analysis refresh

    const jobs = await getAnalysesNeedingRefresh();
    // Found analyses needing refresh

    if (jobs.length === 0) {
      // No analyses need refresh
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
        // Waiting before next batch
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }

    // Background refresh completed
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

  // Background AI refresh scheduler started
}
