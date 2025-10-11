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
  const [activeTab, setActiveTab] = useState<"ads" | "organic" | "analysis">(
    "ads"
  );
  const [loadingData, setLoadingData] = useState(true);

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
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "analysis"
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  AI Analysis
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "ads" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-6">
                    Paid Ads Analysis
                  </h3>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image vs Video Bar Chart */}
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Image vs Video Distribution
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={[
                            { name: "Image", value: 45, color: "#8B5CF6" },
                            { name: "Video", value: 55, color: "#06B6D4" },
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

                    {/* Ad Frequency Change */}
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                      <h4 className="text-md font-semibold text-white mb-4">
                        Ad Frequency Change (Per Day)
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={[
                            { day: "Mon", frequency: 12 },
                            { day: "Tue", frequency: 15 },
                            { day: "Wed", frequency: 18 },
                            { day: "Thu", frequency: 14 },
                            { day: "Fri", frequency: 20 },
                            { day: "Sat", frequency: 16 },
                            { day: "Sun", frequency: 10 },
                          ]}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="day"
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
                            formatter={(value) => [`${value} ads`, "Frequency"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="frequency"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
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

              {activeTab === "analysis" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    AI Analysis
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-white"
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
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm leading-relaxed">
                          AI analysis for {competitor.name} will be generated
                          based on their advertising patterns, social media
                          engagement, and competitive positioning. This analysis
                          will provide insights into their marketing strategy,
                          content performance, and opportunities for your
                          business.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompetitorDetailPage;
