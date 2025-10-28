"use client";

import React, { useState, useEffect } from "react";
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
} from "recharts";
import { ChartData } from "@/types/dashboard";
import { supabase } from "@/lib/supabase";

const DashboardCharts: React.FC = () => {
  const [competitorActivity, setCompetitorActivity] = useState<ChartData[]>([]);
  const [platformDistribution, setPlatformDistribution] = useState<ChartData[]>(
    []
  );
  const [adTrends, setAdTrends] = useState<Record<string, string | number>[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const fetchAdTrendData = async (
    competitorIds: string[],
    userCompetitors: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => {
    try {
      // Fetch all ads for these competitors (no date filter for now)
      const { data: ads, error } = await supabase
        .from("competitor_ads")
        .select("competitor_id, start_date")
        .in("competitor_id", competitorIds);

      if (error) {
        console.error("Error fetching ads:", error);
        return [];
      }

      // Fetch recent posts for these competitors
      const { data: recentPosts, error: postsError } = await supabase
        .from("competitor_creatives")
        .select("competitor_id, posted_at")
        .in("competitor_id", competitorIds);

      if (postsError) {
        console.error("Error fetching recent posts:", postsError);
        // Continue without recent posts data
      }

      // Create date range for last 30 days to capture more ad activity
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date;
      });

      // Group ads by competitor and date
      const competitorData: { [key: string]: { [key: string]: number } } = {};

      userCompetitors.forEach((uc) => {
        competitorData[uc.competitors.name] = {};
        last30Days.forEach((date) => {
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          competitorData[uc.competitors.name][dateStr] = 0;
        });
      });

      // Count ads per competitor per day
      ads?.forEach((ad) => {
        const adDate = new Date(ad.start_date);
        const dateStr = adDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        // Find competitor name
        const competitor = userCompetitors.find(
          (uc) => uc.competitor_id === ad.competitor_id
        );

        if (competitor && competitorData[competitor.competitors.name]) {
          const currentCount =
            competitorData[competitor.competitors.name][dateStr] || 0;
          competitorData[competitor.competitors.name][dateStr] =
            currentCount + 1;
        }
      });

      // Count recent posts per competitor per day
      recentPosts?.forEach((post) => {
        const postDate = new Date(post.posted_at);
        const dateStr = postDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        // Find competitor name
        const competitor = userCompetitors.find(
          (uc) => uc.competitor_id === post.competitor_id
        );

        if (competitor && competitorData[competitor.competitors.name]) {
          const currentCount =
            competitorData[competitor.competitors.name][dateStr] || 0;
          competitorData[competitor.competitors.name][dateStr] =
            currentCount + 1;
        }
      });

      // Convert to chart format
      const chartData = last30Days.map((date) => {
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const dataPoint: Record<string, string | number> = { date: dateStr };

        userCompetitors.forEach((uc) => {
          dataPoint[uc.competitors.name] =
            competitorData[uc.competitors.name][dateStr] || 0;
        });

        return dataPoint;
      });

      return chartData;
    } catch (error) {
      console.error("Error in fetchAdTrendData:", error);
      return [];
    }
  };

  const fetchChartData = async () => {
    try {
      // Get user's competitors
      const { data: userCompetitors } = await supabase.from("user_competitors")
        .select(`
          competitor_id,
          competitors (id, name)
        `);

      if (!userCompetitors) return;

      const competitorIds = userCompetitors.map((uc) => uc.competitor_id);

      // Fetch competitor activity data (PAID ADS + RECENT POSTS)
      const competitorActivityData = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userCompetitors.map(async (uc: any) => {
          const { count: adCount } = await supabase
            .from("competitor_ads")
            .select("*", { count: "exact", head: true })
            .eq("competitor_id", uc.competitor_id);

          const { count: recentPostsCount } = await supabase
            .from("competitor_creatives")
            .select("*", { count: "exact", head: true })
            .eq("competitor_id", uc.competitor_id);

          return {
            name: uc.competitors.name,
            value: (adCount || 0) + (recentPostsCount || 0),
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          };
        })
      );

      // Fetch Video vs Image distribution (PAID ADS + RECENT POSTS)
      const { data: ads } = await supabase
        .from("competitor_ads")
        .select("media_url")
        .in("competitor_id", competitorIds);

      const { data: recentPosts } = await supabase
        .from("competitor_creatives")
        .select("media_url, post_type")
        .in("competitor_id", competitorIds);

      // Count video vs image ads
      let videoCount = 0;
      let imageCount = 0;

      ads?.forEach((ad) => {
        if (ad.media_url && ad.media_url.includes("video")) {
          videoCount++;
        } else if (ad.media_url && !ad.media_url.includes(",")) {
          imageCount++;
        }
      });

      recentPosts?.forEach((post) => {
        if (
          post.post_type === "reel" ||
          (post.media_url && post.media_url.includes("video"))
        ) {
          videoCount++;
        } else if (post.media_url && !post.media_url.includes(",")) {
          imageCount++;
        }
      });

      const totalAds = videoCount + imageCount;
      const videoPercentage =
        totalAds > 0 ? Math.round((videoCount / totalAds) * 100) : 0;
      const imagePercentage =
        totalAds > 0 ? Math.round((imageCount / totalAds) * 100) : 0;

      const videoImageData = [
        { name: "Video", value: videoPercentage },
        { name: "Image", value: imagePercentage },
      ];

      // Fetch real ad trend data for each competitor
      const trendData = await fetchAdTrendData(competitorIds, userCompetitors);

      setCompetitorActivity(competitorActivityData);
      setPlatformDistribution(videoImageData);
      setAdTrends(trendData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {/* Competitor Activity */}
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Competitor Activity
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={competitorActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: "#9CA3AF" }}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: "#9CA3AF" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB",
              }}
            />
            <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Video vs Image Distribution */}
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Video vs Image
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={platformDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: "#9CA3AF" }}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: "#9CA3AF" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB",
              }}
              formatter={(value) => [`${value}%`, ""]}
            />
            <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ad Trend Over Time */}
      <div className="bg-gray-800 rounded-lg p-6 lg:col-span-2 xl:col-span-1">
        <h3 className="text-lg font-semibold text-white mb-4">
          Ad Trend Over Time
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={adTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: "#9CA3AF" }}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: "#9CA3AF" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB",
              }}
              formatter={(value, name) => [`${value} ads`, name]}
            />
            {/* Dynamic lines for each competitor */}
            {competitorActivity.map((competitor, index) => {
              const colors = [
                "#8B5CF6",
                "#3B82F6",
                "#06B6D4",
                "#F59E0B",
                "#EF4444",
              ];
              const color = colors[index % colors.length];

              return (
                <Line
                  key={competitor.name}
                  type="monotone"
                  dataKey={competitor.name}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {competitorActivity.map((competitor, index) => {
            const colors = [
              "#8B5CF6",
              "#3B82F6",
              "#06B6D4",
              "#F59E0B",
              "#EF4444",
            ];
            const color = colors[index % colors.length];

            return (
              <div
                key={competitor.name}
                className="flex items-center space-x-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm text-gray-400">{competitor.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
