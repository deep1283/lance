/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const StrategyLabPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"competitors" | "trending">(
    "competitors"
  );

  // Strategy data state
  const [loadingTab, setLoadingTab] = useState(false);
  const [insights, setInsights] = useState<unknown | null>(null);
  const [creativeDetails, setCreativeDetails] = useState<unknown[]>([]);

  // Modal state for creative details
  const [selectedCreative, setSelectedCreative] = useState<unknown | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Trending data state
  const [trendingHashtags, setTrendingHashtags] = useState<unknown | null>(null);
  const [trendingKeywords, setTrendingKeywords] = useState<unknown | null>(null);
  const [trendingAnalysis, setTrendingAnalysis] = useState<unknown | null>(null);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Load competitor insights for current user (latest window)
  React.useEffect(() => {
    const loadData = async () => {
      if (!user || activeTab !== "competitors") return;
      setLoadingTab(true);
      try {
        // Get the most recent record that has actual data (non-empty arrays)
        const { data: row } = await supabase
          .from("strategy_competitors")
          .select("*")
          .eq("user_id", user.id)
          .not("top_hashtags", "eq", "[]")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setInsights(row);

        // Fetch live metrics for top creatives if present
        const postIds = (row?.top_creatives || []).map((c: unknown) => (c as { post_id: string }).post_id);

        if (postIds.length > 0) {
          const { data: posts } = await supabase
            .from("competitor_creatives")
            .select(
              "id, competitor_id, post_type, caption, media_url, likes_count, views_count, comments_count, posted_at"
            )
            .in("id", postIds);
          setCreativeDetails(posts || []);
        } else {
          setCreativeDetails([]);
        }
      } finally {
        setLoadingTab(false);
      }
    };
    loadData();
  }, [user, activeTab]);

  // Load trending data for current user (latest week)
  React.useEffect(() => {
    const loadTrendingData = async () => {
      if (!user || activeTab !== "trending") return;
      setLoadingTrending(true);
      try {
        // Get the most recent trending hashtags
        const { data: hashtagsRow } = await supabase
          .from("strategy_trending_hashtags")
          .select("*")
          .eq("user_id", user.id)
          .not("hashtags", "eq", "[]")
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        setTrendingHashtags(hashtagsRow);

        // Get the most recent trending keywords
        const { data: keywordsRow } = await supabase
          .from("strategy_trending_keywords")
          .select("*")
          .eq("user_id", user.id)
          .not("keywords", "eq", "[]")
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        setTrendingKeywords(keywordsRow);

        // Get the most recent trending analysis
        const { data: analysisRow } = await supabase
          .from("strategy_trending_analysis")
          .select("*")
          .eq("user_id", user.id)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        setTrendingAnalysis(analysisRow);
      } finally {
        setLoadingTrending(false);
      }
    };
    loadTrendingData();
  }, [user, activeTab]);

  // Note: Auth check is handled by middleware

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <DashboardSidebar />
      <div className="lg:ml-16 transition-all duration-300 pt-16 lg:pt-0">
        <DashboardHeader />
        <main className="p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              Strategy Lab
            </h1>

            {/* Tabs */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="border-b border-gray-700">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("competitors")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "competitors"
                        ? "border-violet-500 text-violet-400"
                        : "border-transparent text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    Competitors
                  </button>
                  <button
                    onClick={() => setActiveTab("trending")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "trending"
                        ? "border-violet-500 text-violet-400"
                        : "border-transparent text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    Trending
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "competitors" && (
                  <div className="text-gray-300 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">
                        Competitors
                      </h2>
                    </div>

                    {loadingTab ? (
                      <div className="text-sm text-gray-400">
                        Loading insights...
                      </div>
                    ) : !insights ? (
                      <div className="text-sm text-gray-400">
                        No insights found. Use the admin to generate.
                      </div>
                    ) : (
                      <>
                        {/* Top Hashtags */}
                        <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                          <h3 className="text-md font-semibold text-white mb-3">
                            Top Hashtags
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {((insights as { top_hashtags?: unknown[] })?.top_hashtags || [])
                              .slice(0, 10)
                              .map((h: unknown, idx: number) => {
                              const hashtag = h as { tag?: string; hashtag?: string; frequency?: number } | string;
                              return (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full bg-violet-600/10 text-violet-300 border border-violet-700/40 text-xs"
                                >
                                  {typeof hashtag === 'string' ? hashtag : (hashtag.tag || hashtag.hashtag || String(hashtag))}
                                  {typeof hashtag === 'object' && hashtag.frequency ? ` · ${hashtag.frequency}` : ""}
                                </span>
                              )})}
                          </div>
                        </div>

                        {/* Top Keywords */}
                        <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                          <h3 className="text-md font-semibold text-white mb-3">
                            Top Keywords
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {((insights as { top_keywords?: unknown[] })?.top_keywords || [])
                              .slice(0, 20)
                              .map((k: unknown, idx: number) => {
                              const keyword = k as { term?: string; keyword?: string; frequency?: number } | string;
                              return (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full bg-green-600/10 text-green-300 border border-green-700/40 text-xs"
                                >
                                  {typeof keyword === 'string' ? keyword : (keyword.term || keyword.keyword || String(keyword))}
                                  {typeof keyword === 'object' && keyword.frequency ? ` · ${keyword.frequency}` : ""}
                                </span>
                              )})}
                          </div>
                        </div>

                        {/* Top Creatives (weekly analysis) */}
                        <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                          <h3 className="text-md font-semibold text-white mb-4">
                            Top Creatives (weekly analysis)
                          </h3>
                          {creativeDetails.length === 0 ? (
                            <div className="text-sm text-gray-400">
                              No creatives available.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {creativeDetails.slice(0, 5).map((post: unknown) => {
                                const p = post as { id: string; post_type: string; media_url: string; caption: string; likes_count?: number; views_count?: number; comments_count?: number };
                                return (
                                <div
                                  key={p.id}
                                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
                                  onClick={() => {
                                    setSelectedCreative(post);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  {p.media_url &&
                                    (p.post_type === "reel" ? (
                                      <div className="relative">
                                        <video
                                          src={p.media_url}
                                          className="w-full h-48 object-cover rounded mb-3"
                                          preload="metadata"
                                          muted
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="bg-black bg-opacity-50 rounded-full p-3">
                                            <svg
                                              className="w-8 h-8 text-white"
                                              fill="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path d="M8 5v14l11-7z" />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    ) : p.post_type === "carousel" ? (
                                      <div className="w-full h-48 rounded mb-3 overflow-hidden">
                                        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                                          {p.media_url
                                            .split(",")
                                            .map((url: string, idx: number) => (
                                              <img
                                                key={idx}
                                                src={url.trim()}
                                                className="flex-shrink-0 w-32 h-48 object-cover rounded"
                                                alt={`carousel ${idx + 1}`}
                                              />
                                            ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <img
                                        src={p.media_url}
                                        className="w-full h-48 object-cover rounded mb-3"
                                        alt="creative"
                                      />
                                    ))}
                                  <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                                    {p.caption}
                                  </p>
                                  <div className="text-xs text-gray-400 flex items-center gap-3">
                                    <span>❤ {p.likes_count || 0}</span>
                                    {p.post_type === "reel" && (
                                      <span>▶ {p.views_count || 0}</span>
                                    )}
                                    <span>💬 {p.comments_count || 0}</span>
                                  </div>
                                  {(() => {
                                    const postedAt = (p as unknown as { posted_at?: string }).posted_at;
                                    return postedAt ? (
                                      <div className="text-[11px] text-gray-500 mt-1">
                                        {new Date(postedAt).toLocaleDateString()}
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              )})}
                            </div>
                          )}
                        </div>

                        {/* For You - Manual Recommendations */}
                        <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                          <h3 className="text-md font-semibold text-white mb-4">
                            For You
                          </h3>

                          {/* Manual Hashtags */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">
                              Recommended Hashtags
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {((insights as { manual_hashtags?: string[] })?.manual_hashtags || []).map(
                                (hashtag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-300 border border-blue-700/40 text-xs"
                                  >
                                    {hashtag}
                                  </span>
                                )
                              )}
                              {(!(insights as { manual_hashtags?: string[] })?.manual_hashtags ||
                                (insights as { manual_hashtags?: string[] }).manual_hashtags?.length === 0) && (
                                <span className="text-gray-500 text-sm">
                                  No manual hashtags added yet
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Manual Keywords */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-3">
                              Recommended Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {((insights as { manual_keywords?: string[] })?.manual_keywords || []).map(
                                (keyword: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full bg-orange-600/10 text-orange-300 border border-orange-700/40 text-xs"
                                  >
                                    {keyword}
                                  </span>
                                )
                              )}
                              {(!(insights as { manual_keywords?: string[] })?.manual_keywords ||
                                (insights as { manual_keywords?: string[] }).manual_keywords?.length === 0) && (
                                <span className="text-gray-500 text-sm">
                                  No manual keywords added yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "trending" && (
                  <div className="text-gray-300 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">
                        Trending
                      </h2>
                    </div>

                    {loadingTrending ? (
                      <div className="text-sm text-gray-400">
                        Loading trending data...
                      </div>
                    ) : !trendingHashtags &&
                      !trendingKeywords &&
                      !trendingAnalysis ? (
                      <div className="text-sm text-gray-400">
                        No trending data available yet.
                      </div>
                    ) : (
                      <>
                        {/* Trending Hashtags */}
                        {trendingHashtags && (
                          <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                            <h3 className="text-md font-semibold text-white mb-3">
                              Trending Hashtags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {((trendingHashtags as { hashtags?: string[] })?.hashtags || []).map(
                                (hashtag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full bg-violet-600/10 text-violet-300 border border-violet-700/40 text-xs"
                                  >
                                    {hashtag}
                                  </span>
                                )
                              )}
                              {(!(trendingHashtags as { hashtags?: string[] })?.hashtags ||
                                (trendingHashtags as { hashtags?: string[] }).hashtags?.length === 0) && (
                                <span className="text-gray-500 text-sm">
                                  No hashtags added yet
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Trending Keywords Table */}
                        {trendingKeywords && (
                          <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                            <h3 className="text-md font-semibold text-white mb-4">
                              Trending Keywords
                            </h3>
                            {!(trendingKeywords as { keywords?: unknown[] })?.keywords ||
                            (trendingKeywords as { keywords?: unknown[] }).keywords?.length === 0 ? (
                              <span className="text-gray-500 text-sm">
                                No keywords added yet
                              </span>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-700">
                                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-300">
                                        Keyword
                                      </th>
                                      <th className="text-center py-3 px-2 text-sm font-semibold text-gray-300">
                                        Frequency
                                      </th>
                                      <th className="text-center py-3 px-2 text-sm font-semibold text-gray-300">
                                        Engagement Index
                                      </th>
                                      <th className="text-center py-3 px-2 text-sm font-semibold text-gray-300">
                                        Trend
                                      </th>
                                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-300">
                                        Notes
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {((trendingKeywords as { keywords?: unknown[] })?.keywords || []).map(
                                      (keyword: unknown, idx: number) => {
                                        const k = keyword as { keyword?: string; frequency?: number; avg_engagement?: number; trend_signal?: string; notes?: string };
                                        return (
                                        <tr
                                          key={idx}
                                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                        >
                                          <td className="py-3 px-2 text-sm text-white">
                                            {k.keyword || "N/A"}
                                          </td>
                                          <td className="py-3 px-2 text-sm text-center text-gray-300">
                                            {k.frequency || 0}
                                          </td>
                                          <td className="py-3 px-2 text-sm text-center">
                                            <span className="text-white">
                                              {k.avg_engagement || 0}%{" "}
                                              {k.trend_signal || ""}
                                            </span>
                                          </td>
                                          <td className="py-3 px-2 text-sm text-center text-2xl">
                                            {k.trend_signal || ""}
                                          </td>
                                          <td className="py-3 px-2 text-sm text-gray-400">
                                            {k.notes || ""}
                                          </td>
                                        </tr>
                                      )})}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Trending Analysis */}
                        {trendingAnalysis && (
                          <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                            <h3 className="text-md font-semibold text-white mb-4">
                              Strategic Analysis
                            </h3>
                            <div className="space-y-5">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                  🎯 This Week&apos;s Trend
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {((trendingAnalysis as { this_weeks_trend?: string })?.this_weeks_trend) ||
                                    "No analysis yet"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                  💡 What You Should Do
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {((trendingAnalysis as { what_you_should_do?: string })?.what_you_should_do) ||
                                    "No recommendations yet"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                  ⚠️ Opportunity
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {((trendingAnalysis as { opportunity?: string })?.opportunity) ||
                                    "No opportunities identified yet"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Creative Modal */}
      {isModalOpen && selectedCreative !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Creative Details
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Media Display */}
                <div className="flex justify-center">
                  {(() => {
                    const creative = selectedCreative as { post_type?: string; media_url?: string; caption?: string; likes_count?: number; views_count?: number; comments_count?: number };
                    if (creative.post_type === "reel") {
                      return (
                        <video
                          src={creative.media_url}
                          className="max-w-full max-h-96 rounded-lg"
                          controls
                          autoPlay
                        />
                      );
                    } else if (creative.post_type === "carousel") {
                      return (
                        <div className="max-w-full">
                          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                            {creative.media_url?.split(",").map((url: string, idx: number) => (
                              <img
                                key={idx}
                                src={url.trim()}
                                className="flex-shrink-0 w-64 h-64 object-cover rounded-lg"
                                alt={`carousel ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <img
                          src={creative.media_url}
                          className="max-w-full max-h-96 object-cover rounded-lg"
                          alt="creative"
                        />
                      );
                    }
                  })()}
                </div>

                {/* Caption */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Caption
                  </h4>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">
                    {((selectedCreative as { caption?: string })?.caption) || "No caption available"}
                  </p>
                </div>

                {/* Engagement Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {((selectedCreative as { likes_count?: number })?.likes_count) || 0}
                    </div>
                    <div className="text-xs text-gray-400">Likes</div>
                  </div>
                  {((selectedCreative as { post_type?: string })?.post_type) === "reel" && (
                    <div className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {((selectedCreative as { views_count?: number })?.views_count) || 0}
                      </div>
                      <div className="text-xs text-gray-400">Views</div>
                    </div>
                  )}
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {((selectedCreative as { comments_count?: number })?.comments_count) || 0}
                    </div>
                    <div className="text-xs text-gray-400">Comments</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {(() => {
                        const creative = selectedCreative as { post_type?: string; likes_count?: number; views_count?: number; comments_count?: number };
                        return creative.post_type === "reel"
                          ? (creative.likes_count || 0) +
                            (creative.views_count || 0) +
                            (creative.comments_count || 0)
                          : (creative.likes_count || 0) +
                            (creative.comments_count || 0);
                      })()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Total Engagement
                    </div>
                  </div>
                </div>

                {/* Post Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="ml-2 text-white capitalize">
                      {((selectedCreative as { post_type?: string })?.post_type) || 'unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Posted:</span>
                    <span className="ml-2 text-white">
                      {(() => {
                        const postedAt = (selectedCreative as { posted_at?: string })?.posted_at;
                        return postedAt ? new Date(postedAt).toLocaleDateString() : "Unknown";
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyLabPage;
