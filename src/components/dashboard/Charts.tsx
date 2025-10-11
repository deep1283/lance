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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { ChartData, TimeSeriesData } from "@/types/dashboard";
import { supabase } from "@/lib/supabase";

const DashboardCharts: React.FC = () => {
  const [competitorActivity, setCompetitorActivity] = useState<ChartData[]>([]);
  const [platformDistribution, setPlatformDistribution] = useState<ChartData[]>(
    []
  );
  const [adTrends, setAdTrends] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

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

      // Fetch competitor activity data
      const competitorActivityData = await Promise.all(
        userCompetitors.map(async (uc: any) => {
          const { count: adCount } = await supabase
            .from("competitor_ads")
            .select("*", { count: "exact", head: true })
            .eq("competitor_id", uc.competitor_id);

          const { count: creativeCount } = await supabase
            .from("competitor_creatives")
            .select("*", { count: "exact", head: true })
            .eq("competitor_id", uc.competitor_id);

          return {
            name: uc.competitors.name,
            value: (adCount || 0) + (creativeCount || 0),
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          };
        })
      );

      // Fetch platform distribution
      const { data: ads } = await supabase
        .from("competitor_ads")
        .select("platform")
        .in("competitor_id", competitorIds);

      const { data: creatives } = await supabase
        .from("competitor_creatives")
        .select("platform")
        .in("competitor_id", competitorIds);

      const platformCounts: { [key: string]: number } = {};

      [...(ads || []), ...(creatives || [])].forEach((item) => {
        const platform = item.platform || "Unknown";
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });

      const platformData = Object.entries(platformCounts).map(
        ([name, value]) => ({
          name,
          value,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        })
      );

      // Generate sample trend data (last 7 days)
      const trendData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          ads: Math.floor(Math.random() * 20) + 5,
          creatives: Math.floor(Math.random() * 15) + 3,
          engagement: Math.floor(Math.random() * 1000) + 100,
        };
      });

      setCompetitorActivity(competitorActivityData);
      setPlatformDistribution(platformData);
      setAdTrends(trendData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

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
          <BarChart
            data={[
              { name: "Video", value: 65 },
              { name: "Image", value: 35 },
            ]}
          >
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
            />
            <Line
              type="monotone"
              dataKey="ads"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="creatives"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
