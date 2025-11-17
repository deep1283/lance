import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRateLimitFallback,
} from "@/lib/ai-fallback-content";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface AIAnalysisHook {
  analysis: string;
  loading: boolean;
  error: string | null;
}

// Global cache to prevent multiple simultaneous calls
const globalCache = new Map<
  string,
  {
    analysis: string;
    timestamp: number;
    loading: boolean;
  }
>();

// Global loading states to prevent duplicate calls
const globalLoadingStates = new Set<string>();

async function getAIAnalysis(
  userId: string,
  competitorId: string,
  analysisType: string
): Promise<{ analysis: string; error: string | null }> {
  const cacheKey = `${competitorId}-${analysisType}`;

  // Check if we already have a cached analysis
  const cached = globalCache.get(cacheKey);
  if (cached) {
    // Returning cached analysis from memory
    return {
      analysis: cached.analysis,
      error: null,
    };
  }

  // Check if this analysis is already being loaded
  if (globalLoadingStates.has(cacheKey)) {
    // Analysis already being loaded, waiting...
    // Wait for the existing call to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const updatedCache = globalCache.get(cacheKey);
        if (updatedCache && !updatedCache.loading) {
          clearInterval(checkInterval);
          resolve({
            analysis: updatedCache.analysis,
            error: null,
          });
        }
      }, 100);
    });
  }

  // Mark as loading
  globalLoadingStates.add(cacheKey);
  globalCache.set(cacheKey, {
    analysis: "",
    timestamp: Date.now(),
    loading: true,
  });

  try {
    // Determine which competitor ID to look up for competitive analysis
    let lookupCompetitorId = competitorId;

    if (analysisType === "competitive_intelligence") {
      const { data: userCompetitors } = await supabase
        .from("user_competitors")
        .select("competitor_id")
        .eq("user_id", userId)
        .limit(1);

      if (userCompetitors && userCompetitors.length > 0) {
        lookupCompetitorId = userCompetitors[0].competitor_id;
      }
    }

    const analysisQuery = supabase
      .from("ai_analyses")
      .select("content")
      .eq("analysis_type", analysisType)
      .eq("competitor_id", lookupCompetitorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Competitive intelligence stays user-scoped
    if (analysisType === "competitive_intelligence") {
      analysisQuery.eq("user_id", userId);
    }

    const { data, error } = await analysisQuery;

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    const analysis =
      data?.content ||
      "AI analysis is being generated. Please check back shortly.";

    // Update cache
    globalCache.set(cacheKey, {
      analysis,
      timestamp: Date.now(),
      loading: false,
    });

    return {
      analysis,
      error: null,
    };
  } catch (error) {
    console.error("Error calling AI analysis API:", error);

    // Get appropriate fallback content based on error type
    let fallbackContent;
    if (error instanceof Error && error.message.includes("429")) {
      fallbackContent = getRateLimitFallback();
    } else {
      // Default fallback for other errors
      fallbackContent = {
        title: "📊 Analysis Temporarily Unavailable",
        type: "warning" as const,
        content:
          "AI analysis is temporarily unavailable. Please try again later.",
      };
    }

    const fallbackAnalysis = `## ${fallbackContent.title}\n\n${fallbackContent.content}`;

    // Update cache with fallback
    globalCache.set(cacheKey, {
      analysis: fallbackAnalysis,
      timestamp: Date.now(),
      loading: false,
    });

    return {
      analysis: fallbackAnalysis,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    // Remove from loading states
    globalLoadingStates.delete(cacheKey);
  }
}

export function useAIAnalysis(
  competitorId: string,
  analysisType:
    | "paid_ads_analysis"
    | "organic_content_analysis"
    | "competitive_intelligence"
    | "viral_reels_analysis"
): AIAnalysisHook {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const hasInitialized = useRef(false);

  const fetchAnalysis = useCallback(async () => {
    if (!user || !competitorId) return;

    const cacheKey = `${competitorId}-${analysisType}`;
    const cached = globalCache.get(cacheKey);

    // If we have cached data, use it immediately
    if (cached && !cached.loading) {
      setAnalysis(cached.analysis);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }

    const result = await getAIAnalysis(user.id, competitorId, analysisType);
    setAnalysis(result.analysis);
    setError(result.error);
    setLoading(false);
  }, [user, competitorId, analysisType]);

  useEffect(() => {
    // Only fetch on initial load, not on every render
    // Also check if competitorId is not empty to avoid calls during initialization
    if (
      !hasInitialized.current &&
      user &&
      competitorId &&
      competitorId.trim() !== ""
    ) {
      hasInitialized.current = true;
      fetchAnalysis();
    }
  }, [competitorId, analysisType, user, fetchAnalysis]);

  return { analysis, loading, error };
}
