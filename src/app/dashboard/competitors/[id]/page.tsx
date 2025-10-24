"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Competitor, Ad, Creative } from "@/types/dashboard";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import AIAnalysisDisplay from "@/components/AIAnalysisDisplay";
import SkeletonLoader from "@/components/SkeletonLoader";
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
  const [ads, setAds] = useState<Ad[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [topPosts, setTopPosts] = useState<Creative[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [creativesLoading, setCreativesLoading] = useState(true);
  const [topPostsLoading, setTopPostsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(null);

  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(
    null
  );
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  // AI Analysis hooks
  const paidAdsAnalysis = useAIAnalysis(
    params.id as string,
    "paid_ads_analysis"
  );
  const organicAnalysis = useAIAnalysis(
    params.id as string,
    "organic_content_analysis"
  );

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

      // Fetch all data in parallel for much faster loading
      const [adsResult, creativesResult, topPostsResult] = await Promise.allSettled([
        // Fetch competitor ads
        supabase
          .from("competitor_ads")
          .select("*")
          .eq("competitor_id", params.id)
          .order("start_date", { ascending: false }),
        
        // Fetch competitor creatives (organic social media)
        supabase
          .from("competitor_creatives")
          .select("*")
          .eq("competitor_id", params.id)
          .order("posted_at", { ascending: false }),
        
        // Fetch competitor top posts (viral reels)
        supabase
          .from("competitor_top_posts")
          .select("*")
          .eq("competitor_id", params.id)
          .order("posted_at", { ascending: false })
      ]);

      // Process ads data
      if (adsResult.status === "fulfilled") {
        const { data: adsData, error: adsError } = adsResult.value;
        if (adsError) {
          console.error("Error fetching ads:", adsError);
          setAds([]);
        } else {
          setAds(adsData || []);
        }
      } else {
        console.error("Ads fetch failed:", adsResult.reason);
        setAds([]);
      }
      setAdsLoading(false);

      // Process creatives data
      if (creativesResult.status === "fulfilled") {
        const { data: creativesData, error: creativesError } = creativesResult.value;
        if (creativesError) {
          console.error("Error fetching creatives:", creativesError);
          setCreatives([]);
        } else {
          setCreatives(creativesData || []);
        }
      } else {
        console.error("Creatives fetch failed:", creativesResult.reason);
        setCreatives([]);
      }
      setCreativesLoading(false);

      // Process top posts data
      if (topPostsResult.status === "fulfilled") {
        const { data: topPostsData, error: topPostsError } = topPostsResult.value;
        if (topPostsError) {
          console.error("Error fetching top posts:", topPostsError);
          setTopPosts([]);
        } else {
          setTopPosts(topPostsData || []);
        }
      } else {
        console.error("Top posts fetch failed:", topPostsResult.reason);
        setTopPosts([]);
      }
      setTopPostsLoading(false);
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
                      {paidAdsAnalysis.loading ? (
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500"></div>
                          <p className="text-gray-300 text-sm">
                            Generating AI analysis...
                          </p>
                        </div>
                      ) : (
                        <AIAnalysisDisplay
                          analysis={paidAdsAnalysis.analysis}
                          isLoading={paidAdsAnalysis.loading}
                        />
                      )}
                    </div>
                  </div>

                  {/* Real Ads Display */}
                  {adsLoading ? (
                    <div className="mb-8">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Loading Ads...
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SkeletonLoader type="grid" count={6} />
                      </div>
                    </div>
                  ) : ads.length > 0 ? (
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
                                      url: ad.image_url || "",
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
                            {ad.carousel_images &&
                              ad.carousel_images.split(",").length > 0 && (
                                <div className="mb-3">
                                  <div className="flex overflow-x-auto gap-2 pb-2">
                                    {ad.carousel_images
                                      .split(",")
                                      .map(
                                        (imageUrl: string, index: number) => (
                                          <div
                                            key={index}
                                            className="relative group cursor-pointer flex-shrink-0"
                                          >
                                            <img
                                              src={imageUrl}
                                              alt={`${
                                                ad.ad_title || "Carousel"
                                              } - Image ${index + 1}`}
                                              className="w-32 h-32 object-cover rounded-lg"
                                              onClick={() =>
                                                setSelectedMedia({
                                                  type: "image",
                                                  url: imageUrl,
                                                })
                                              }
                                            />
                                            <div className="absolute inset-0 pointer-events-none bg-transparent group-hover:bg-black/30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                                  />
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
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
                                      url: ad.video_url || "",
                                    })
                                  }
                                  preload="metadata"
                                  poster={ad.image_url || undefined} // Use image as poster if available
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
                            <div
                              className="text-sm text-gray-300 cursor-pointer hover:bg-gray-800 rounded-lg p-2 transition-colors"
                              onClick={() => setSelectedAd(ad)}
                            >
                              {ad.cta_text && (
                                <p className="font-medium text-blue-400 mb-1">
                                  {ad.cta_text}
                                </p>
                              )}
                              <p className="text-gray-400 capitalize">
                                {ad.platform}
                              </p>
                              {ad.ad_copy && (
                                <p className="text-gray-400 mt-1 line-clamp-2">
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
                                <span
                                  className={`font-medium ${
                                    ad.is_active
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {ad.is_active ? "Active" : "Expired"}
                                </span>
                              </div>
                              <p className="font-medium text-white mt-2">
                                {ad.ad_title}
                              </p>
                              <div className="text-xs text-blue-400 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                                Click for full details
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

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
                      {organicAnalysis.loading ? (
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500"></div>
                          <p className="text-gray-300 text-sm">
                            Generating AI analysis...
                          </p>
                        </div>
                      ) : (
                        <AIAnalysisDisplay
                          analysis={organicAnalysis.analysis}
                          isLoading={organicAnalysis.loading}
                        />
                      )}
                    </div>
                  </div>

                  {/* Recent Posts */}
                  {creativesLoading ? (
                    <div className="mb-8">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Loading Recent Posts...
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SkeletonLoader type="grid" count={6} />
                      </div>
                    </div>
                  ) : creatives.length > 0 ? (
                    <div className="mb-8">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Recent Posts ({creatives.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {creatives.map((creative, index) => (
                          <div
                            key={index}
                            className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                          >
                            {creative.image_url && (
                              <div className="relative group cursor-pointer">
                                <img
                                  src={creative.image_url}
                                  alt={creative.caption || "Organic Post"}
                                  className="w-full h-48 object-cover rounded-lg mb-3"
                                  onClick={() =>
                                    setSelectedMedia({
                                      type: "image",
                                      url: creative.image_url || "",
                                    })
                                  }
                                />
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

                            {creative.carousel_images &&
                              creative.carousel_images.split(",").length >
                                0 && (
                                <div className="mb-3">
                                  <div className="flex overflow-x-auto gap-2 pb-2">
                                    {creative.carousel_images
                                      .split(",")
                                      .map(
                                        (imageUrl: string, index: number) => (
                                          <div
                                            key={index}
                                            className="relative group cursor-pointer flex-shrink-0"
                                          >
                                            <img
                                              src={imageUrl}
                                              alt={`${
                                                creative.caption || "Carousel"
                                              } - Image ${index + 1}`}
                                              className="w-32 h-32 object-cover rounded-lg"
                                              onClick={() =>
                                                setSelectedMedia({
                                                  type: "image",
                                                  url: imageUrl,
                                                })
                                              }
                                            />
                                            <div className="absolute inset-0 pointer-events-none bg-transparent group-hover:bg-black/30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                                  />
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </div>
                              )}

                            {creative.video_url && (
                              <div className="relative group cursor-pointer">
                                <video
                                  src={creative.video_url}
                                  className="w-full h-48 object-cover rounded-lg mb-3"
                                  onClick={() =>
                                    setSelectedMedia({
                                      type: "video",
                                      url: creative.video_url || "",
                                    })
                                  }
                                  preload="metadata"
                                  poster={creative.image_url || undefined}
                                />
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
                            <div
                              className="text-sm text-gray-300 cursor-pointer hover:bg-gray-800 rounded-lg p-2 transition-colors"
                              onClick={() => setSelectedCreative(creative)}
                            >
                              <p className="font-medium text-white mb-1 capitalize">
                                {creative.platform} {creative.post_type}
                              </p>
                              {creative.caption && (
                                <p className="text-gray-400 mb-2 line-clamp-2">
                                  {creative.caption}
                                </p>
                              )}
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{creative.likes_count || 0} likes</span>
                                {creative.post_type === "reel" && (
                                  <span>{creative.views_count || 0} views</span>
                                )}
                                <span>
                                  {creative.comments_count || 0} comments
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {creative.posted_at &&
                                  new Date(
                                    creative.posted_at
                                  ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-blue-400 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                                Click for full details
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Most Viral Posts */}
                  {topPosts.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Most Viral Posts ({topPosts.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topPosts.map((post, index) => (
                          <div
                            key={index}
                            className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                          >
                            {post.video_url && (
                              <div className="relative group cursor-pointer">
                                <video
                                  src={post.video_url}
                                  className="w-full h-48 object-cover rounded-lg mb-3"
                                  onClick={() =>
                                    setSelectedMedia({
                                      type: "video",
                                      url: post.video_url || "",
                                    })
                                  }
                                  preload="metadata"
                                />
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

                            {post.carousel_images &&
                              post.carousel_images.split(",").length > 0 && (
                                <div className="mb-3">
                                  <div className="flex overflow-x-auto gap-2 pb-2">
                                    {post.carousel_images
                                      .split(",")
                                      .map(
                                        (imageUrl: string, index: number) => (
                                          <div
                                            key={index}
                                            className="relative group cursor-pointer flex-shrink-0"
                                          >
                                            <img
                                              src={imageUrl}
                                              alt={`${
                                                post.caption || "Carousel"
                                              } - Image ${index + 1}`}
                                              className="w-32 h-32 object-cover rounded-lg"
                                              onClick={() =>
                                                setSelectedMedia({
                                                  type: "image",
                                                  url: imageUrl,
                                                })
                                              }
                                            />
                                            <div className="absolute inset-0 pointer-events-none bg-transparent group-hover:bg-black/30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                                  />
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                  </div>
                                </div>
                              )}
                            <div
                              className="text-sm text-gray-300 cursor-pointer hover:bg-gray-800 rounded-lg p-2 transition-colors"
                              onClick={() => setSelectedCreative(post)}
                            >
                              <p className="font-medium text-white mb-1 capitalize">
                                {post.platform} {post.post_type}
                              </p>
                              {post.caption && (
                                <p className="text-gray-400 mb-2 line-clamp-2">
                                  {post.caption}
                                </p>
                              )}
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{post.likes_count || 0} likes</span>
                                {post.post_type === "reel" && (
                                  <span>{post.views_count || 0} views</span>
                                )}
                                <span>{post.comments_count || 0} comments</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {post.posted_at &&
                                  new Date(post.posted_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-blue-400 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                                Click for full details
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                            data={(() => {
                              // Use all creatives from competitor_creatives table for charts
                              const totalCreatives = creatives.length;
                              const imagePosts = creatives.filter(
                                (c) => c.post_type === "image"
                              ).length;
                              const videoPosts = creatives.filter(
                                (c) => c.post_type === "reel"
                              ).length;

                              if (totalCreatives === 0) {
                                return [
                                  { name: "Image", value: 0 },
                                  { name: "Video", value: 0 },
                                ];
                              }

                              return [
                                {
                                  name: "Image",
                                  value: Math.round(
                                    (imagePosts / totalCreatives) * 100
                                  ),
                                },
                                {
                                  name: "Video",
                                  value: Math.round(
                                    (videoPosts / totalCreatives) * 100
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

                      {/* Engagement Frequency Change */}
                      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                        <h4 className="text-md font-semibold text-white mb-4">
                          Engagement Frequency Change
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart
                            data={(() => {
                              // Group creatives by posted_at date (last 7 days)
                              const last7Days = Array.from(
                                { length: 7 },
                                (_, i) => {
                                  const date = new Date();
                                  date.setDate(date.getDate() - (6 - i));
                                  return date;
                                }
                              );

                              return last7Days.map((date) => {
                                const dateStr = date.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                );

                                // Find creatives posted on this date
                                const dayCreatives = creatives.filter(
                                  (creative) => {
                                    const creativeDate = new Date(
                                      creative.posted_at
                                    );
                                    return (
                                      creativeDate.toDateString() ===
                                      date.toDateString()
                                    );
                                  }
                                );

                                // Calculate total engagement for this day
                                const totalEngagement = dayCreatives.reduce(
                                  (sum, creative) => {
                                    if (creative.post_type === "reel") {
                                      return (
                                        sum +
                                        (creative.likes_count || 0) +
                                        (creative.views_count || 0)
                                      );
                                    } else if (creative.post_type === "image") {
                                      return sum + (creative.likes_count || 0);
                                    } else {
                                      return sum + (creative.likes_count || 0);
                                    }
                                  },
                                  0
                                );

                                return {
                                  week: dateStr,
                                  likes: totalEngagement,
                                  change: "+0%", // Simplified for now
                                };
                              });
                            })()}
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
                          data={(() => {
                            // Use all creatives from competitor_creatives table for charts

                            const imagePosts = creatives.filter(
                              (c) => c.post_type === "image"
                            );
                            const videoPosts = creatives.filter(
                              (c) => c.post_type === "reel"
                            );

                            const imageEngagement = imagePosts.reduce(
                              (sum, creative) =>
                                sum + (creative.likes_count || 0),
                              0
                            );
                            const videoEngagement = videoPosts.reduce(
                              (sum, creative) => {
                                return (
                                  sum +
                                  (creative.likes_count || 0) +
                                  (creative.views_count || 0)
                                );
                              },
                              0
                            );

                            const avgImageEngagement =
                              imagePosts.length > 0
                                ? Math.round(
                                    imageEngagement / imagePosts.length
                                  )
                                : 0;
                            const avgVideoEngagement =
                              videoPosts.length > 0
                                ? Math.round(
                                    videoEngagement / videoPosts.length
                                  )
                                : 0;

                            return [
                              {
                                type: "Image",
                                engagement: imageEngagement,
                                posts: imagePosts.length,
                                avgEngagement: avgImageEngagement,
                              },
                              {
                                type: "Video",
                                engagement: videoEngagement,
                                posts: videoPosts.length,
                                avgEngagement: avgVideoEngagement,
                              },
                            ];
                          })()}
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

      {/* Creative Details Modal */}
      {selectedCreative && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCreative(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl p-6 border border-gray-700">
            <button
              onClick={() => setSelectedCreative(null)}
              className="absolute top-4 right-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-all"
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

            <div onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-white mb-6">
                {selectedCreative.platform} {selectedCreative.post_type} Details
              </h3>

              {/* Image/Video Preview */}
              {selectedCreative.image_url && (
                <div className="mb-6">
                  <img
                    src={selectedCreative.image_url}
                    alt="Creative preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {selectedCreative.video_url && (
                <div className="mb-6">
                  <video
                    src={selectedCreative.video_url}
                    controls
                    className="w-full h-64 object-cover rounded-lg"
                    poster={selectedCreative.image_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Carousel Images */}
              {selectedCreative.carousel_images &&
                selectedCreative.carousel_images.split(",").length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Carousel Images
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedCreative.carousel_images
                        .split(",")
                        .map((imageUrl: string, index: number) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`Carousel ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                    </div>
                  </div>
                )}

              {/* Full Caption */}
              {selectedCreative.caption && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Caption
                  </h4>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedCreative.caption}
                  </p>
                </div>
              )}

              {/* Engagement Metrics */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Engagement Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {selectedCreative.likes_count || 0}
                    </div>
                    <div className="text-sm text-gray-400">Likes</div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {selectedCreative.comments_count || 0}
                    </div>
                    <div className="text-sm text-gray-400">Comments</div>
                  </div>
                </div>
              </div>

              {/* Post Details */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Post Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform:</span>
                    <span className="text-white capitalize">
                      {selectedCreative.platform}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Post Type:</span>
                    <span className="text-white capitalize">
                      {selectedCreative.post_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Posted At:</span>
                    <span className="text-white">
                      {selectedCreative.posted_at &&
                        new Date(
                          selectedCreative.posted_at
                        ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paid Ad Details Modal */}
      {selectedAd && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAd(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl p-6 border border-gray-700">
            <button
              onClick={() => setSelectedAd(null)}
              className="absolute top-4 right-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-all"
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

            <div onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-white mb-6">
                Paid Ad Details
              </h3>

              {/* Image/Video Preview */}
              {selectedAd.image_url && (
                <div className="mb-6">
                  <img
                    src={selectedAd.image_url}
                    alt="Ad preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {selectedAd.video_url && (
                <div className="mb-6">
                  <video
                    src={selectedAd.video_url}
                    controls
                    className="w-full h-64 object-cover rounded-lg"
                    poster={selectedAd.image_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Carousel Images */}
              {selectedAd.carousel_images &&
                selectedAd.carousel_images.split(",").length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Carousel Images
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedAd.carousel_images
                        .split(",")
                        .map((imageUrl: string, index: number) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`Carousel ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                    </div>
                  </div>
                )}

              {/* Ad Copy */}
              {selectedAd.ad_copy && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Ad Copy
                  </h4>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedAd.ad_copy}
                  </p>
                </div>
              )}

              {/* Ad Information */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Ad Information
                </h4>
                <div className="space-y-2">
                  {selectedAd.cta_text && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">CTA Text:</span>
                      <span className="text-white">{selectedAd.cta_text}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform:</span>
                    <span className="text-white capitalize">
                      {selectedAd.platform}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`font-medium ${
                        selectedAd.is_active ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {selectedAd.is_active ? "Active" : "Expired"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start Date:</span>
                    <span className="text-white">
                      {selectedAd.start_date &&
                        new Date(selectedAd.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  {!selectedAd.is_active && selectedAd.end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">End Date:</span>
                      <span className="text-white">
                        {new Date(selectedAd.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Title:</span>
                    <span className="text-white">{selectedAd.ad_title}</span>
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

export default CompetitorDetailPage;
