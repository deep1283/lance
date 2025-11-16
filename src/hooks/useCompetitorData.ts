import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Competitor, Ad, Creative } from "@/types/dashboard";

const supabase = createClient();

interface CompetitorData {
  competitor: Competitor | null;
  ads: Ad[];
  creatives: Creative[];
  topPosts: Creative[];
}

interface CompetitorDataCache {
  data: CompetitorData;
  timestamp: number;
}

// Cache for storing competitor data
const competitorDataCache = new Map<string, CompetitorDataCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCompetitorData = (competitorId: string) => {
  const [data, setData] = useState<CompetitorData>({
    competitor: null,
    ads: [],
    creatives: [],
    topPosts: [],
  });
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(true);
  const [creativesLoading, setCreativesLoading] = useState(true);
  const [topPostsLoading, setTopPostsLoading] = useState(true);

  const fetchCompetitorData = useCallback(async () => {
    if (!competitorId) return;

    // Check cache first
    const cached = competitorDataCache.get(competitorId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data);
      setLoading(false);
      setAdsLoading(false);
      setCreativesLoading(false);
      setTopPostsLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch competitor data first
      const { data: competitorData, error: competitorError } = await supabase
        .from("competitors")
        .select("*")
        .eq("id", competitorId)
        .single();

      if (competitorError) throw competitorError;

      // Fetch all other data in parallel
      const [adsResult, creativesResult, topPostsResult] =
        await Promise.allSettled([
          supabase
            .from("competitor_ads")
            .select("*")
            .eq("competitor_id", competitorId)
            .order("start_date", { ascending: false }),

          supabase
            .from("competitor_creatives")
            .select("*")
            .eq("competitor_id", competitorId)
            .order("posted_at", { ascending: false }),

          supabase
            .from("competitor_top_posts")
            .select("*")
            .eq("competitor_id", competitorId)
            .order("posted_at", { ascending: false }),
        ]);

      // Process results
      const ads =
        adsResult.status === "fulfilled" ? adsResult.value.data || [] : [];
      const creatives =
        creativesResult.status === "fulfilled"
          ? creativesResult.value.data || []
          : [];
      const topPosts =
        topPostsResult.status === "fulfilled"
          ? topPostsResult.value.data || []
          : [];

      const competitorDataResult = {
        competitor: competitorData,
        ads,
        creatives,
        topPosts,
      };

      // Cache the result
      competitorDataCache.set(competitorId, {
        data: competitorDataResult,
        timestamp: Date.now(),
      });

      setData(competitorDataResult);
      setAdsLoading(false);
      setCreativesLoading(false);
      setTopPostsLoading(false);
    } catch (error) {
      console.error("Error fetching competitor data:", error);
    } finally {
      setLoading(false);
    }
  }, [competitorId]);

  useEffect(() => {
    fetchCompetitorData();
  }, [fetchCompetitorData]);

  const refreshData = useCallback(() => {
    competitorDataCache.delete(competitorId);
    fetchCompetitorData();
  }, [competitorId, fetchCompetitorData]);

  return {
    ...data,
    loading,
    adsLoading,
    creativesLoading,
    topPostsLoading,
    refreshData,
  };
};
