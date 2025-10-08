"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Competitor } from "@/types/dashboard";

interface CompetitorOverviewProps {
  competitors: Competitor[];
}

const CompetitorOverview: React.FC<CompetitorOverviewProps> = ({
  competitors,
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
        Your Competitors
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {competitors.filter(Boolean).map((comp, idx) => (
          <motion.div
            key={comp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link href={`/dashboard/competitors/${comp.id}`}>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-[#2a2a2a] hover:border-[#6c63ff]/50 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#5a52d5] flex items-center justify-center text-white font-bold">
                    {comp.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-[#6c63ff] transition-colors">
                      {comp?.name || "Unknown Competitor"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {comp?.industry || "Industry"}
                    </p>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      comp?.status === "active" ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </div>

                <div className="flex gap-4 text-sm text-gray-400">
                  <div>
                    <span className="text-[#6c63ff] font-semibold">0</span> Ads
                  </div>
                  <div>
                    <span className="text-[#6c63ff] font-semibold">0</span>{" "}
                    Posts
                  </div>
                </div>

                <div className="mt-4 text-sm text-[#6c63ff] group-hover:underline">
                  View Details →
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CompetitorOverview;
