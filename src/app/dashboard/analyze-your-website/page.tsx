"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabase";

const AnalyzeYourWebsitePage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Note: Auth check is handled by middleware

  // Guard: redirect to approval if access revoked while logged in
  React.useEffect(() => {
    if (!user) return;
    let isActive = true;

    const checkApproval = async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("is_approved")
          .eq("id", user.id)
          .single();
        if (isActive && data && data.is_approved === false) {
          if (typeof window !== "undefined") {
            window.location.replace("/approval");
          }
        }
      } catch (_) {}
    };

    checkApproval();

    const channel = supabase
      .channel(`user-approval-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          const nextApproved = (
            payload as unknown as { new?: { is_approved?: boolean } }
          ).new?.is_approved;
          if (nextApproved === false) {
            if (typeof window !== "undefined") {
              window.location.replace("/approval");
            }
          }
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [user]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;

    setIsAnalyzing(true);

    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      alert("Website analysis feature coming soon!");
    }, 2000);
  };

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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Analyze Your Website
            </h1>
            <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
              Get AI-powered insights about your website&apos;s performance and
              SEO
            </p>

            <div className="bg-gray-800 rounded-lg p-6 sm:p-8 border border-gray-700">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Coming Soon
                </h2>
                <p className="text-gray-400">
                  Website analysis feature is under development. You&apos;ll be
                  able to analyze your website&apos;s SEO performance, speed,
                  and competitive positioning.
                </p>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-6">
                <div>
                  <label
                    htmlFor="website-url"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="website-url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-500"
                    disabled
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing || !websiteUrl.trim()}
                  className="w-full py-3 px-6 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Website"}
                </button>
              </form>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    Speed Analysis
                  </h3>
                  <p className="text-sm text-gray-400">
                    Page load times and performance metrics
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    SEO Analysis
                  </h3>
                  <p className="text-sm text-gray-400">
                    Keywords, meta tags, and search optimization
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    Competitive Analysis
                  </h3>
                  <p className="text-sm text-gray-400">
                    Compare against your competitors
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnalyzeYourWebsitePage;
