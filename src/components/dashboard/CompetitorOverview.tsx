"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CompetitorWithStats } from "@/types/dashboard";
import { supabase } from "@/lib/supabase";
import { usePrefetch } from "@/hooks/usePrefetch";

const CompetitorOverview: React.FC = () => {
  const [competitors, setCompetitors] = useState<CompetitorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { prefetchCompetitor } = usePrefetch();

  useEffect(() => {
    fetchCompetitorsWithStats();
  }, []);

  const fetchCompetitorsWithStats = async () => {
    try {
      // Get competitors assigned to the user
      const { data: userCompetitors, error: userError } = await supabase.from(
        "user_competitors"
      ).select(`
          competitor_id,
          competitors (
            id,
            name,
            website_url,
            industry,
            status,
            created_at
          )
        `);

      if (userError) throw userError;

      // Get stats for each competitor
      const competitorsWithStats = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (userCompetitors || []).map(async (uc: any) => {
          const competitor = uc.competitors;

          // Get ad count
          const { count: adCount } = await supabase
            .from("competitor_ads")
            .select("*", { count: "exact", head: true })
            .eq("competitor_id", competitor.id);

          // Get creative count
          const { count: creativeCount } = await supabase
            .from("competitor_creatives")
            .select("*", { count: "exact", head: true })
            .eq("competitor_id", competitor.id);

          // Get total engagement
          const { data: creatives } = await supabase
            .from("competitor_creatives")
            .select("likes_count, views_count, comments_count, post_type")
            .eq("competitor_id", competitor.id);

          const totalEngagement =
            creatives?.reduce((sum, c) => {
              if (c.post_type === "reel") {
                return sum + (c.likes_count || 0) + (c.views_count || 0);
              } else {
                return sum + (c.likes_count || 0);
              }
            }, 0) || 0;

          return {
            ...competitor,
            ad_count: adCount || 0,
            creative_count: creativeCount || 0,
            total_engagement: totalEngagement,
          };
        })
      );

      setCompetitors(competitorsWithStats);
    } catch (error) {
      console.error("Error fetching competitors:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="h-3 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          No Competitors Found
        </h3>
        <p className="text-gray-400">
          Competitors will appear here once they are added to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {competitors.map((competitor) => (
        <Link
          key={competitor.id}
          href={`/dashboard/competitors/${competitor.id}`}
          prefetch={true}
          onMouseEnter={() => prefetchCompetitor(competitor.id)}
          className="block"
        >
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 hover:bg-gray-750 transition-colors border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {competitor.name}
              </h3>
              <div
                className={`w-3 h-3 rounded-full ${
                  competitor.status === "active"
                    ? "bg-green-500"
                    : "bg-gray-500"
                }`}
              />
            </div>

            {competitor.industry && (
              <p className="text-gray-400 text-sm mb-4">
                {competitor.industry}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-400">
                  {competitor.ad_count}
                </div>
                <div className="text-xs text-gray-400">Active Ads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {competitor.creative_count}
                </div>
                <div className="text-xs text-gray-400">Social Posts</div>
              </div>
            </div>

            {competitor.total_engagement > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-400">
                    {competitor.total_engagement.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Total Engagement</div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                Added {new Date(competitor.created_at).toLocaleDateString()}
              </span>
              <span className="text-violet-400">View Details →</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CompetitorOverview;
