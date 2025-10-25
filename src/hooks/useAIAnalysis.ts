import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCompetitiveIntelligenceFallback,
  getPaidAdsFallback,
  getOrganicContentFallback,
  getViralReelsFallback,
  getRateLimitFallback,
} from "@/lib/ai-fallback-content";

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
  competitorId: string,
  analysisType: string,
  session: { access_token: string } | null
): Promise<{ analysis: string; error: string | null }> {
  const cacheKey = `${competitorId}-${analysisType}`;

  // Check if we already have a recent analysis (less than 2 days old)
  const cached = globalCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 2 * 24 * 60 * 60 * 1000) {
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
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ competitorId, analysisType, retrieveOnly: false }), // Set to false to generate initial analyses
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API call failed: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.analysis || "Analysis temporarily unavailable.";

    // Update cache
    globalCache.set(cacheKey, {
      analysis,
      timestamp: Date.now(),
      loading: false,
    });

    return {
      analysis,
      error: data.error || null,
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
  const { user, session } = useAuth();
  const hasInitialized = useRef(false);

  const fetchAnalysis = async () => {
    if (!user || !session || !competitorId) return;

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

    const result = await getAIAnalysis(competitorId, analysisType, session);
    setAnalysis(result.analysis);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    // Only fetch on initial load, not on every render
    // Also check if competitorId is not empty to avoid calls during initialization
    if (
      !hasInitialized.current &&
      user &&
      session &&
      competitorId &&
      competitorId.trim() !== ""
    ) {
      hasInitialized.current = true;
      fetchAnalysis();
    }
  }, [competitorId, analysisType]);

  return { analysis, loading, error };
}
