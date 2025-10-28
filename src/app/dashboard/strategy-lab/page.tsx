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

  // Load competitor insights for current user (latest window)
  React.useEffect(() => {
    const loadData = async () => {
      if (!user || activeTab !== "competitors") return;
      setLoadingTab(true);
      try {
        const { data: row } = await supabase
          .from("strategy_competitors")
          .select("*")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false })
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
                      {insights && (
                        <div className="text-xs text-gray-400">
                          Window: {insights.start_date} → {insights.end_date}
                        </div>
                      )}
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

                        {/* Top Creatives (last 10 days) */}
                        <div className="bg-gray-900 rounded-lg p-5 border border-gray-700">
                          <h3 className="text-md font-semibold text-white mb-4">
                            Top Creatives (last 10 days)
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
                                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                                >
                                  {post.media_url &&
                                    (post.post_type === "reel" ? (
                                      <video
                                        src={post.media_url}
                                        className="w-full h-48 object-cover rounded mb-3"
                                        preload="metadata"
                                        muted
                                      />
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
                      </>
                    )}
                  </div>
                )}

                {activeTab === "trending" && (
                  <div className="text-gray-300">
                    <h2 className="text-lg font-semibold text-white mb-3">
                      Trending
                    </h2>
                    <p className="text-sm text-gray-400">
                      This tab will display weekly trending hashtags, styles,
                      and reels for your niche. We will wire it to Supabase
                      next.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StrategyLabPage;
