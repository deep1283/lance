"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Competitor, Ad, Creative } from "@/types/dashboard";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CompetitorDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [activeTab, setActiveTab] = useState<"ads" | "organic">("ads");
  const [loadingData, setLoadingData] = useState(true);
  const [ads, setAds] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchCompetitorData();
    }
  }, [user, params.id]);

  const fetchCompetitorData = async () => {
    try {
      // Verify user has access to this competitor
      const { data: userCompetitor, error: accessError } = await supabase
        .from("user_competitors")
        .select("competitor_id")
        .eq("user_id", user?.id)
        .eq("competitor_id", params.id)
        .single();

      if (accessError || !userCompetitor) {
        router.push("/dashboard");
        return;
      }

      // Fetch competitor details
      const { data: competitorData, error: competitorError } = await supabase
        .from("competitors")
        .select("*")
        .eq("id", params.id)
        .single();

      if (competitorError) throw competitorError;
      setCompetitor(competitorData);

      // Fetch competitor ads
      const { data: adsData, error: adsError } = await supabase
        .from("competitor_ads")
        .select("*")
        .eq("competitor_id", params.id)
        .order("start_date", { ascending: false });

      if (adsError) {
        console.error("Error fetching ads:", adsError);
        setAds([]);
      } else {
        setAds(adsData || []);
        console.log("Fetched ads:", adsData);
        if (adsData && adsData.length > 0) {
          console.log("First ad image_url:", adsData[0].image_url);
          console.log("First ad full data:", adsData[0]);
        }
      }

      // Skip creatives fetch for now since we're using competitor_ads
      setCreatives([]);
    } catch (error) {
      console.error("Error fetching competitor:", error);
      router.push("/dashboard");
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white">Competitor not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <DashboardSidebar />
      <div className="ml-16 lg:ml-16 transition-all duration-300 pt-16 lg:pt-0">
        <DashboardHeader />
        <main className="p-4 sm:p-6">
          {/* Competitor Header */}
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {competitor.name}
                </h1>
                {competitor.industry && (
                  <p className="text-gray-400">{competitor.industry}</p>
                )}
                {competitor.website_url && (
                  <a
                    href={competitor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 text-sm"
                  >
                    {competitor.website_url}
                  </a>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    competitor.status === "active"
                      ? "bg-green-500"
                      : "bg-gray-500"
                  }`}
                />
                <span className="text-sm text-gray-400 capitalize">
                  {competitor.status}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="border-b border-gray-700">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab("ads")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "ads"
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Paid Ads
                </button>
                <button
                  onClick={() => setActiveTab("organic")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "organic"
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Organic Social Media
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "ads" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-6">
                    Paid Ads Analysis
                  </h3>

                  {/* AI Analysis Section */}
                  <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 mb-8 border border-[#2a2a2a] hover:border-violet-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            AI Analysis
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Powered by Advanced AI
                          </p>
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
                      <p className="text-gray-300 text-sm leading-relaxed">
                        <strong className="text-violet-400">
                          Shreehari's Paid Ads Strategy:
                        </strong>{" "}
                        The competitor is leveraging seasonal marketing with
                        strong emotional appeal through festive themes. Their
                        jewelry-focused campaigns target high-value customers
                        (₹3000+ purchases) with compelling gift offers. The
                        visual strategy emphasizes traditional Indian aesthetics
                        combined with modern presentation, creating aspirational
                        content that drives conversions.
                      </p>
                    </div>
                  </div>

                  {/* Real Ads Display */}
                  {ads.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Active Ads ({ads.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ads.map((ad, index) => (
                          <div
                            key={index}
                            className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                          >
                            {ad.image_url && (
                              <div className="relative group cursor-pointer">
                                <img
                                  src={ad.image_url}
                                  alt={ad.ad_title || "Ad Image"}
                                  className="w-full h-48 object-cover rounded-lg mb-3"
                                  onClick={() =>
                                    setSelectedMedia({
                                      type: "image",
                                      url: ad.image_url,
                                    })
                                  }
                                />
                                {/* Overlay fix: allow clicks through and disable base opacity */}
                                <div className="absolute inset-0 pointer-events-none bg-transparent group-hover:bg-black/30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <svg
                                      className="w-8 h-8 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}
                            {ad.video_url && (
                              <div className="relative group cursor-pointer">
                                <video
                                  src={ad.video_url}
                                  className="w-full h-48 object-cover rounded-lg mb-3"
                                  onClick={() =>
                                    setSelectedMedia({
                                      type: "video",
                                      url: ad.video_url,
                                    })
                                  }
                                  preload="metadata"
                                  poster={ad.image_url} // Use image as poster if available
                                />
                                {/* Overlay fix: allow clicks through and disable base opacity */}
                                <div className="absolute inset-0 pointer-events-none bg-transparent group-hover:bg-black/30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <svg
                                      className="w-8 h-8 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="text-sm text-gray-300">
                              <p className="font-medium text-white mb-1">
                                {ad.ad_title}
                              </p>
                              <p className="text-gray-400 capitalize">
                                {ad.platform}
                              </p>
                              {ad.ad_copy && (
                                <p className="text-gray-400 mt-1">
                                  {ad.ad_copy}
                                </p>
                              )}
                              <div className="flex justify-between text-xs text-gray-500 mt-2">
                                {ad.start_date && (
                                  <span>
                                    Start:{" "}
                                    {new Date(
                                      ad.start_date
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                                {ad.end_date && (
                                  <span>
                                    End:{" "}
                                    {new Date(ad.end_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dynamic Image vs Video Bar Chart */}
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Image vs Video Distribution
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={(() => {
                            const totalAds = ads.length;
                            const imageAds = ads.filter(
                              (ad) => ad.image_url
                            ).length;

                            if (totalAds === 0) {
                              return [
                                { name: "Image", value: 0 },
                                { name: "Video", value: 0 },
                              ];
                            }

                            return [
                              {
                                name: "Image",
                                value: Math.round((imageAds / totalAds) * 100),
                              },
                              {
                                name: "Video",
                                value: Math.round(
                                  ((totalAds - imageAds) / totalAds) * 100
                                ),
                              },
                            ];
                          })()}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tick={{ fill: "#9CA3AF" }}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tick={{ fill: "#9CA3AF" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1F2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#F9FAFB",
                            }}
                            formatter={(value) => [`${value}%`, ""]}
                          />
                          <Bar
                            dataKey="value"
                            fill="#8B5CF6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Dynamic Ad Frequency Chart */}
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Recent Ads Timeline
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={(() => {
                            // Group ads by start date
                            const adDates = ads.map((ad) =>
                              ad.start_date
                                ? new Date(ad.start_date).toLocaleDateString()
                                : "No Date"
                            );
                            const dateCounts = adDates.reduce((acc, date) => {
                              acc[date] = (acc[date] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);

                            return Object.entries(dateCounts).map(
                              ([date, count]) => ({
                                date,
                                count,
                              })
                            );
                          })()}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tick={{ fill: "#9CA3AF" }}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tick={{ fill: "#9CA3AF" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1F2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#F9FAFB",
                            }}
                            formatter={(value) => [`${value} ads`, "Count"]}
                          />
                          <Bar
                            dataKey="count"
                            fill="#8B5CF6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "organic" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-6">
                    Organic Social Media Analysis
                  </h3>

                  {/* AI Analysis Section */}
                  <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 mb-8 border border-[#2a2a2a] hover:border-violet-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            AI Analysis
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Powered by Advanced AI
                          </p>
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
                      <p className="text-gray-300 text-sm leading-relaxed">
                        <strong className="text-violet-400">
                          Shreehari's Organic Strategy:
                        </strong>{" "}
                        The brand maintains strong community engagement through
                        authentic storytelling and cultural celebration. Their
                        organic content focuses on showcasing jewelry
                        craftsmanship, customer testimonials, and
                        behind-the-scenes content. The approach emphasizes
                        trust-building and brand loyalty through consistent,
                        high-quality visual content that resonates with
                        traditional Indian values while appealing to modern
                        aesthetics.
                      </p>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="space-y-6">
                    {/* Top Row - Image vs Video and Engagement Frequency */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Image vs Video Bar Chart */}
                      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                        <h4 className="text-md font-semibold text-white mb-4">
                          Image vs Video Distribution
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={[
                              { name: "Image", value: 60, color: "#8B5CF6" },
                              { name: "Video", value: 40, color: "#06B6D4" },
                            ]}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#374151"
                            />
                            <XAxis
                              dataKey="name"
                              stroke="#9CA3AF"
                              fontSize={12}
                              tick={{ fill: "#9CA3AF" }}
                            />
                            <YAxis
                              stroke="#9CA3AF"
                              fontSize={12}
                              tick={{ fill: "#9CA3AF" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                                color: "#F9FAFB",
                              }}
                              formatter={(value) => [`${value}%`, ""]}
                            />
                            <Bar
                              dataKey="value"
                              fill="#8B5CF6"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Engagement Frequency Change */}
                      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                        <h4 className="text-md font-semibold text-white mb-4">
                          Engagement Frequency Change
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart
                            data={[
                              { week: "Week 1", likes: 1200, change: "+5%" },
                              { week: "Week 2", likes: 1350, change: "+12%" },
                              { week: "Week 3", likes: 1180, change: "-13%" },
                              { week: "Week 4", likes: 1420, change: "+20%" },
                              { week: "Week 5", likes: 1580, change: "+11%" },
                              { week: "Week 6", likes: 1650, change: "+4%" },
                            ]}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#374151"
                            />
                            <XAxis
                              dataKey="week"
                              stroke="#9CA3AF"
                              fontSize={12}
                              tick={{ fill: "#9CA3AF" }}
                            />
                            <YAxis
                              stroke="#9CA3AF"
                              fontSize={12}
                              tick={{ fill: "#9CA3AF" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                                color: "#F9FAFB",
                              }}
                              formatter={(value, name, props) => [
                                `${value} likes (${props.payload.change})`,
                                "Engagement",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="likes"
                              stroke="#06B6D4"
                              strokeWidth={3}
                              dot={{ fill: "#06B6D4", strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Engagement vs Content Type */}
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Engagement vs Content Type
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              type: "Image",
                              engagement: 850,
                              posts: 25,
                              avgEngagement: 34,
                            },
                            {
                              type: "Video",
                              engagement: 1200,
                              posts: 15,
                              avgEngagement: 80,
                            },
                          ]}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="type"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tick={{ fill: "#9CA3AF" }}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tick={{ fill: "#9CA3AF" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1F2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#F9FAFB",
                            }}
                            formatter={(value, name) => {
                              if (name === "engagement")
                                return [
                                  `${value} total likes`,
                                  "Total Engagement",
                                ];
                              if (name === "posts")
                                return [`${value} posts`, "Total Posts"];
                              if (name === "avgEngagement")
                                return [
                                  `${value} avg likes/post`,
                                  "Avg Engagement",
                                ];
                              return [value, name];
                            }}
                          />
                          <Bar
                            dataKey="engagement"
                            fill="#8B5CF6"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="posts"
                            fill="#06B6D4"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center space-x-6 mt-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-violet-500 rounded"></div>
                          <span className="text-sm text-gray-400">
                            Total Engagement
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                          <span className="text-sm text-gray-400">
                            Number of Posts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Fullscreen Media Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
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

            {selectedMedia.type === "image" && (
              <img
                src={selectedMedia.url}
                alt="Fullscreen view"
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: "90vh" }}
              />
            )}

            {selectedMedia.type === "video" && (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] object-contain"
                style={{ maxHeight: "90vh" }}
                onClick={(e) => e.stopPropagation()}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorDetailPage;
