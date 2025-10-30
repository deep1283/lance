"use client";

import React, { useState } from "react";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const StrategyLabPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"competitors" | "trending">(
    "competitors"
  );

  // Strategy data state
  const [loadingTab, setLoadingTab] = useState(false);
  const [insights, setInsights] = useState<any | null>(null);
  const [creativeDetails, setCreativeDetails] = useState<any[]>([]);

  // Modal state for creative details
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Trending data state
  const [trendingHashtags, setTrendingHashtags] = useState<any | null>(null);
  const [trendingKeywords, setTrendingKeywords] = useState<any | null>(null);
  const [trendingAnalysis, setTrendingAnalysis] = useState<any | null>(null);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Load competitor insights for current user (latest window)
  React.useEffect(() => {
    const loadData = async () => {
      if (!user || activeTab !== "competitors") return;
      setLoadingTab(true);
      try {
        // Get the most recent record that has actual data (non-empty arrays)
        const { data: row, error } = await supabase
          .from("strategy_competitors")
          .select("*")
          .eq("user_id", user.id)
          .not("top_hashtags", "eq", "[]")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setInsights(row);

        // Fetch live metrics for top creatives if present
        const postIds = (row?.top_creatives || []).map((c: any) => c.post_id);

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

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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
                            {(insights.top_hashtags || [])
                              .slice(0, 10)
                              .map((h: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full bg-violet-600/10 text-violet-300 border border-violet-700/40 text-xs"
                                >
                                  {h.tag || h.hashtag || h}
                                  {h.frequency ? ` · ${h.frequency}` : ""}
                                </span>
                              ))}
                          </div>
                        </div>

                        {/* Top Keywords */}
                        <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                          <h3 className="text-md font-semibold text-white mb-3">
                            Top Keywords
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {(insights.top_keywords || [])
                              .slice(0, 20)
                              .map((k: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 rounded-full bg-green-600/10 text-green-300 border border-green-700/40 text-xs"
                                >
                                  {k.term || k.keyword || k}
                                  {k.frequency ? ` · ${k.frequency}` : ""}
                                </span>
                              ))}
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
                              {creativeDetails.slice(0, 5).map((post: any) => (
                                <div
                                  key={post.id}
                                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
                                  onClick={() => {
                                    setSelectedCreative(post);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  {post.media_url &&
                                    (post.post_type === "reel" ? (
                                      <div className="relative">
                                        <video
                                          src={post.media_url}
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
                                    ) : post.post_type === "carousel" ? (
                                      <div className="w-full h-48 rounded mb-3 overflow-hidden">
                                        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                                          {post.media_url
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
                                        src={post.media_url}
                                        className="w-full h-48 object-cover rounded mb-3"
                                        alt="creative"
                                      />
                                    ))}
                                  <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                                    {post.caption}
                                  </p>
                                  <div className="text-xs text-gray-400 flex items-center gap-3">
                                    <span>❤ {post.likes_count || 0}</span>
                                    {post.post_type === "reel" && (
                                      <span>▶ {post.views_count || 0}</span>
                                    )}
                                    <span>💬 {post.comments_count || 0}</span>
                                  </div>
                                  {post.posted_at && (
                                    <div className="text-[11px] text-gray-500 mt-1">
                                      {new Date(
                                        post.posted_at
                                      ).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
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
                              {(insights.manual_hashtags || []).map(
                                (hashtag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-300 border border-blue-700/40 text-xs"
                                  >
                                    {hashtag}
                                  </span>
                                )
                              )}
                              {(!insights.manual_hashtags ||
                                insights.manual_hashtags.length === 0) && (
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
                              {(insights.manual_keywords || []).map(
                                (keyword: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full bg-orange-600/10 text-orange-300 border border-orange-700/40 text-xs"
                                  >
                                    {keyword}
                                  </span>
                                )
                              )}
                              {(!insights.manual_keywords ||
                                insights.manual_keywords.length === 0) && (
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
                              {(trendingHashtags.hashtags || []).map(
                                (hashtag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full bg-violet-600/10 text-violet-300 border border-violet-700/40 text-xs"
                                  >
                                    {hashtag}
                                  </span>
                                )
                              )}
                              {(!trendingHashtags.hashtags ||
                                trendingHashtags.hashtags.length === 0) && (
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
                            {!trendingKeywords.keywords ||
                            trendingKeywords.keywords.length === 0 ? (
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
                                    {(trendingKeywords.keywords || []).map(
                                      (keyword: any, idx: number) => (
                                        <tr
                                          key={idx}
                                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                        >
                                          <td className="py-3 px-2 text-sm text-white">
                                            {keyword.keyword || "N/A"}
                                          </td>
                                          <td className="py-3 px-2 text-sm text-center text-gray-300">
                                            {keyword.frequency || 0}
                                          </td>
                                          <td className="py-3 px-2 text-sm text-center">
                                            <span className="text-white">
                                              {keyword.avg_engagement || 0}%{" "}
                                              {keyword.trend_signal || ""}
                                            </span>
                                          </td>
                                          <td className="py-3 px-2 text-sm text-center text-2xl">
                                            {keyword.trend_signal || ""}
                                          </td>
                                          <td className="py-3 px-2 text-sm text-gray-400">
                                            {keyword.notes || ""}
                                          </td>
                                        </tr>
                                      )
                                    )}
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
                                  {trendingAnalysis.this_weeks_trend ||
                                    "No analysis yet"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                  💡 What You Should Do
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {trendingAnalysis.what_you_should_do ||
                                    "No recommendations yet"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                  ⚠️ Opportunity
                                </h4>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {trendingAnalysis.opportunity ||
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
      {isModalOpen && selectedCreative && (
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
                  {selectedCreative.post_type === "reel" ? (
                    <video
                      src={selectedCreative.media_url}
                      className="max-w-full max-h-96 rounded-lg"
                      controls
                      autoPlay
                    />
                  ) : selectedCreative.post_type === "carousel" ? (
                    <div className="max-w-full">
                      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                        {selectedCreative.media_url
                          .split(",")
                          .map((url: string, idx: number) => (
                            <img
                              key={idx}
                              src={url.trim()}
                              className="flex-shrink-0 w-64 h-64 object-cover rounded-lg"
                              alt={`carousel ${idx + 1}`}
                            />
                          ))}
                      </div>
                    </div>
                  ) : (
                    <img
                      src={selectedCreative.media_url}
                      className="max-w-full max-h-96 object-cover rounded-lg"
                      alt="creative"
                    />
                  )}
                </div>

                {/* Caption */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Caption
                  </h4>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">
                    {selectedCreative.caption || "No caption available"}
                  </p>
                </div>

                {/* Engagement Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {selectedCreative.likes_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">Likes</div>
                  </div>
                  {selectedCreative.post_type === "reel" && (
                    <div className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {selectedCreative.views_count || 0}
                      </div>
                      <div className="text-xs text-gray-400">Views</div>
                    </div>
                  )}
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {selectedCreative.comments_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">Comments</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {selectedCreative.post_type === "reel"
                        ? (selectedCreative.likes_count || 0) +
                          (selectedCreative.views_count || 0) +
                          (selectedCreative.comments_count || 0)
                        : (selectedCreative.likes_count || 0) +
                          (selectedCreative.comments_count || 0)}
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
                      {selectedCreative.post_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Posted:</span>
                    <span className="ml-2 text-white">
                      {selectedCreative.posted_at
                        ? new Date(
                            selectedCreative.posted_at
                          ).toLocaleDateString()
                        : "Unknown"}
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
