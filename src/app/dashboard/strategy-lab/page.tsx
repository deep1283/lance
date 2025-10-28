"use client";

import React, { useState } from "react";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const StrategyLabPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"competitors" | "trending">(
    "competitors"
  );

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
                  <div className="text-gray-300">
                    <h2 className="text-lg font-semibold text-white mb-3">
                      Competitors
                    </h2>
                    <p className="text-sm text-gray-400">
                      This tab will show competitor insights and planning tools.
                      We will add functionality next.
                    </p>
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
