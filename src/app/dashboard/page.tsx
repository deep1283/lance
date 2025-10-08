"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import CompetitorOverview from "@/components/dashboard/CompetitorOverview";
import DashboardCharts from "@/components/dashboard/Charts";
import { Competitor } from "@/types/dashboard";

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchCompetitors = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_competitors")
        .select(
          `
          *,
          competitors (*)
        `
        )
        .eq("user_id", user.id);

      if (!error && data) {
        setCompetitors(data.map((uc) => uc.competitors).filter(Boolean));
      }
      setLoadingData(false);
    };

    fetchCompetitors();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0b0f] to-[#111111] text-[#E5E5E5] font-[var(--font-roboto)]">
      <DashboardSidebar competitors={competitors} />

      <div className="lg:ml-16 transition-all duration-300">
        <DashboardHeader />

        <main className="px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-gray-400 mb-8">
              Track your competitors and analyze performance
            </p>

            {loadingData ? (
              <div className="text-center py-20">Loading competitors...</div>
            ) : competitors.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400">No competitors added yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Contact admin to add competitors to your account.
                </p>
              </div>
            ) : (
              <>
                <CompetitorOverview competitors={competitors} />
                <DashboardCharts competitors={competitors} />
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
