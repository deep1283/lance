"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { CompetitorWithStats } from "@/types/dashboard";
import { createClient } from "@/lib/supabase/client";
// Removed AI analysis from main dashboard

const supabase = createClient();

// Lazy load heavy components
const CompetitorOverview = dynamic(
  () => import("@/components/dashboard/CompetitorOverview"),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-800 rounded-lg h-64"></div>
    ),
    ssr: false,
  }
);

const DashboardCharts = dynamic(() => import("@/components/dashboard/Charts"), {
  loading: () => (
    <div className="animate-pulse bg-gray-800 rounded-lg h-96"></div>
  ),
  ssr: false,
});

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [competitors, setCompetitors] = useState<CompetitorWithStats[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [didYouKnow, setDidYouKnow] = useState<unknown[]>([]);

  // AI analysis removed from main dashboard

  // Note: Auth check is handled by middleware

  useEffect(() => {
    if (user) {
      fetchCompetitorsWithStats();
      fetchDidYouKnow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Guard: if approval revoked, redirect to approval page immediately
  useEffect(() => {
    if (!user) return;
    let isActive = true;

    const checkApproval = async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("is_approved")
          .eq("id", user.id)
          .single();
        if (isActive && data && data.is_approved === false) {
          if (typeof window !== "undefined") {
            window.location.replace("/approval");
          }
        }
      } catch {
        // Ignore approval check errors
      }
    };

    checkApproval();

    const channel = supabase
      .channel(`user-approval-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const nextApproved = (
            payload as unknown as { new?: { is_approved?: boolean } }
          ).new?.is_approved;
          if (nextApproved === false) {
            if (typeof window !== "undefined") {
              window.location.replace("/approval");
            }
          }
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      try {
        supabase.removeChannel(channel);
      } catch {
        // Ignore channel cleanup errors
      }
    };
  }, [user]);

  const fetchCompetitorsWithStats = async () => {
    try {
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

      const competitorsWithStats = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (userCompetitors || []).map(async (uc: any) => {
          const competitor = uc.competitors;

          const { count: adCount } = await supabase
            .from("competitor_ads")
            .select("*", { count: "exact", head: true })
            .eq("competitor_id", competitor?.id);

          const { count: creativeCount } = await supabase
            .from("competitor_creatives")
            .select("*", { count: "exact", head: true })
            .eq("competitor_id", competitor?.id);

          const { data: creatives } = await supabase
            .from("competitor_creatives")
            .select("likes_count, views_count, post_type")
            .eq("competitor_id", competitor?.id);

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

      // All competitors fetched successfully
      // Processing competitor data
      setCompetitors(competitorsWithStats);
    } catch (error) {
      console.error("Error fetching competitors:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchDidYouKnow = async () => {
    try {
      if (!user) return;
      
      // Fetch industry-shared notes (RLS policy will automatically filter by user's industry)
      const { data, error } = await supabase
        .from("did_you_know")
        .select("id, note, date")
        .order("date", { ascending: false })
        .limit(3);

      if (error) throw error;
      setDidYouKnow(data || []);
    } catch (error) {
      console.error("Error fetching did you know:", error);
    }
  };

  if (loading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalAds = competitors.reduce((sum, c) => sum + c.ad_count, 0);
  const totalCreatives = competitors.reduce(
    (sum, c) => sum + c.creative_count,
    0
  );
  const totalEngagement = competitors.reduce(
    (sum, c) => sum + c.total_engagement,
    0
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardSidebar />
      <div className="lg:ml-16 transition-all duration-300 pt-16 lg:pt-0">
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Stats Overview - Modern SaaS Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {/* Total Competitors Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 border border-[#2a2a2a] hover:border-violet-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                  <svg
                    className="w-6 h-6 text-white"
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
              </div>
              <p className="text-gray-400 text-sm mb-1 font-medium">
                Total Competitors
              </p>
              <p className="text-3xl font-bold text-white">
                {competitors.length}
              </p>
            </div>

            {/* Total Ads Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 border border-[#2a2a2a] hover:border-blue-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1 font-medium">
                Total Ads
              </p>
              <p className="text-3xl font-bold text-white">{totalAds}</p>
            </div>

            {/* Social Posts Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 border border-[#2a2a2a] hover:border-green-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1 font-medium">
                Social Posts
              </p>
              <p className="text-3xl font-bold text-white">{totalCreatives}</p>
            </div>

            {/* Total Engagement Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 border border-[#2a2a2a] hover:border-pink-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1 font-medium">
                Total Engagement
              </p>
              <p className="text-3xl font-bold text-white">
                {totalEngagement.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top Performers - Two Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Performer for Paid Ads */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 border border-[#2a2a2a] hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Top Paid Ads Performer
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Most active advertiser
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-400 text-sm font-medium">
                    Live
                  </span>
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-5 border border-[#1f1f1f]">
                {(() => {
                  const topPaidAdsCompetitor = competitors.reduce(
                    (max, competitor) =>
                      competitor.ad_count > max.ad_count ? competitor : max,
                    competitors[0] || {
                      name: "No data",
                      ad_count: 0,
                      industry: "",
                    }
                  );

                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              1
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {topPaidAdsCompetitor.name || "No Competitors"}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {topPaidAdsCompetitor.industry ||
                                "Industry not specified"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-400">
                            {topPaidAdsCompetitor.ad_count || 0}
                          </div>
                          <div className="text-gray-400 text-sm">total ads</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">
                              Active Ads
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {topPaidAdsCompetitor.ad_count || 0}
                          </div>
                          <div className="text-gray-500 text-xs">
                            currently running
                          </div>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">
                              Market Share
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {totalAds > 0
                              ? Math.round(
                                  (topPaidAdsCompetitor.ad_count / totalAds) *
                                    100
                                )
                              : 0}
                            %
                          </div>
                          <div className="text-gray-500 text-xs">
                            of total ads
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">
                            Key Insight
                          </span>
                          <span className="text-blue-400 text-xs font-medium">
                            AI Analysis
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mt-2">
                          {topPaidAdsCompetitor.ad_count > 0
                            ? `${topPaidAdsCompetitor.name} leads in paid advertising with ${topPaidAdsCompetitor.ad_count} active campaigns. Strong digital presence with strategic ad placements driving market visibility.`
                            : "No paid ads data available yet. Upload competitor ads to see performance insights."}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Top Performer for Organic Social Media */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 border border-[#2a2a2a] hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Top Organic Performer
                    </h2>
                    <p className="text-gray-400 text-sm">Highest engagement</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">
                    Live
                  </span>
                </div>
              </div>

              <div className="bg-[#0a0a0a] rounded-lg p-5 border border-[#1f1f1f]">
                {(() => {
                  const topOrganicCompetitor = competitors.reduce(
                    (max, competitor) =>
                      competitor.total_engagement > max.total_engagement
                        ? competitor
                        : max,
                    competitors[0] || {
                      name: "No data",
                      total_engagement: 0,
                      industry: "",
                    }
                  );

                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              1
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {topOrganicCompetitor.name || "No Competitors"}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {topOrganicCompetitor.industry ||
                                "Industry not specified"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            {topOrganicCompetitor.total_engagement.toLocaleString() ||
                              0}
                          </div>
                          <div className="text-gray-400 text-sm">
                            total likes
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">
                              Social Posts
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {topOrganicCompetitor.creative_count || 0}
                          </div>
                          <div className="text-gray-500 text-xs">
                            total posts
                          </div>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">
                              Avg Engagement
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {topOrganicCompetitor.creative_count > 0
                              ? Math.round(
                                  topOrganicCompetitor.total_engagement /
                                    topOrganicCompetitor.creative_count
                                )
                              : 0}
                          </div>
                          <div className="text-gray-500 text-xs">
                            likes per post
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">
                            Key Insight
                          </span>
                          <span className="text-green-400 text-xs font-medium">
                            AI Analysis
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mt-2">
                          {topOrganicCompetitor.total_engagement > 0
                            ? `${
                                topOrganicCompetitor.name
                              } leads in organic engagement with ${topOrganicCompetitor.total_engagement.toLocaleString()} total likes. Strong community building and authentic content strategy.`
                            : "No organic social media data available yet. Upload competitor posts to see engagement insights."}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Did You Know 💡 Section */}
          {didYouKnow.length > 0 && (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 mb-8 border border-[#2a2a2a]">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <span className="text-2xl">💡</span>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Did You Know
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {didYouKnow.map((item, index) => {
                  const didYouKnowItem = item as { id: string; note: string };
                  return (
                    <div
                      key={didYouKnowItem.id}
                      className="bg-[#0a0a0a] rounded-lg p-5 border border-[#1f1f1f] hover:border-yellow-500/30 transition-all duration-300 w-full"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-100 text-lg md:text-xl font-semibold leading-relaxed">
                            {didYouKnowItem.note}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Competitor Performance Comparison */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              Competitor Performance Comparison
            </h2>
            <DashboardCharts />
          </div>

          {/* Competitors Overview */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">
              Your Competitors
            </h2>
            <CompetitorOverview />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
