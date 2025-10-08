"use client";

import React from "react";
import { motion } from "framer-motion";
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
import { Competitor } from "@/types/dashboard";

interface ChartsProps {
  competitors: Competitor[];
}

const DashboardCharts: React.FC<ChartsProps> = ({ competitors }) => {
  // Dummy data - will sync with real data later
  const competitorActivity = competitors
    .filter(Boolean)
    .slice(0, 5)
    .map((c) => ({
      name: c?.name || "Unknown",
      ads: Math.floor(Math.random() * 50) + 10,
    }));

  const platformData = [
    { name: "Meta", value: 45, color: "#6c63ff" },
    { name: "Google", value: 30, color: "#5a52d5" },
    { name: "YouTube", value: 25, color: "#4a42c5" },
  ];

  const weeklyTrend = [
    { week: "Week 1", activity: 20 },
    { week: "Week 2", activity: 35 },
    { week: "Week 3", activity: 28 },
    { week: "Week 4", activity: 45 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-semibold">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Competitor Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[#2a2a2a]"
        >
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
            Competitor Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={competitorActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #2a2a2a",
                }}
              />
              <Bar dataKey="ads" fill="#6c63ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Platform Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[#2a2a2a]"
        >
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
            Platform Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #2a2a2a",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {platformData.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-sm text-gray-400">{p.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[#2a2a2a] lg:col-span-2"
        >
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
            Ad Trend Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="week" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #2a2a2a",
                }}
              />
              <Line
                type="monotone"
                dataKey="activity"
                stroke="#6c63ff"
                strokeWidth={2}
                dot={{ fill: "#6c63ff", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardCharts;
