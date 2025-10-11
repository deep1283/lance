"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Competitor } from "@/types/dashboard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import lancelogo from "../../../public/assets/lancelogo.png";
import lancesymbol from "../../../public/assets/lanceIQ-symbol.png";

const DashboardSidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompetitorsOpen, setIsCompetitorsOpen] = useState(true);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCompetitors();
    }
  }, [user]);

  const fetchCompetitors = async () => {
    try {
      if (!user) return;

      // First get the user's competitors from user_competitors table
      const { data: userCompetitors, error: userError } = await supabase
        .from("user_competitors")
        .select("competitor_id")
        .eq("user_id", user.id);

      if (userError) throw userError;

      if (!userCompetitors || userCompetitors.length === 0) {
        setCompetitors([]);
        return;
      }

      // Then get the competitor details
      const competitorIds = userCompetitors.map((uc) => uc.competitor_id);
      const { data: competitorsData, error: competitorsError } = await supabase
        .from("competitors")
        .select("*")
        .in("id", competitorIds)
        .order("name");

      if (competitorsError) throw competitorsError;
      setCompetitors(competitorsData || []);
    } catch (error) {
      console.error("Error fetching competitors:", error);
      setCompetitors([]);
    }
  };

  const filteredCompetitors = competitors.filter((competitor) =>
    competitor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isActive = (path: string) => pathname === path;
  const isCompetitorActive = (competitorId: string) =>
    pathname === `/dashboard/competitors/${competitorId}`;

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg"
      >
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {(isExpanded || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => {
            setIsExpanded(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}

      {/* Sidebar - Responsive */}
      <div
        className={`fixed left-0 top-0 h-full bg-[#0a0a0a] border-r border-[#1f1f1f] transition-all duration-300 z-40 ${
          isExpanded || isMobileMenuOpen ? "w-64" : "w-16"
        } lg:block ${isMobileMenuOpen ? "block" : "hidden lg:block"}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header with Logo */}
        <div className="h-16 flex items-center justify-center border-b border-[#1f1f1f]">
          {isExpanded || isMobileMenuOpen ? (
            <div className="px-4 transition-opacity duration-300">
              <div className="relative">
                <Image
                  src={lancelogo}
                  alt="LanceIQ Logo"
                  className="w-32 relative z-10"
                  priority
                />
                {/* Enhanced Neon glow effect - non-blinking */}
                <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 animate-pulse-slow"></div>
                <div className="absolute inset-0 blur-md opacity-20 bg-violet-400"></div>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <Image
                src={lancesymbol}
                alt="LanceIQ"
                width={32}
                height={32}
                className="w-8 h-8 relative z-10"
              />
              {/* Enhanced Neon glow on symbol - non-blinking */}
              <div className="absolute inset-0 blur-lg opacity-50 bg-violet-500 rounded-full animate-pulse-slow"></div>
              <div className="absolute inset-0 blur-md opacity-30 bg-purple-400 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Search Bar - only visible when expanded */}
        {(isExpanded || isMobileMenuOpen) && (
          <div className="p-3 border-b border-[#1f1f1f] transition-all duration-300">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              />
              <svg
                className="absolute right-3 top-2.5 w-4 h-4 text-gray-500"
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
          </div>
        )}

        {/* Navigation */}
        <nav
          className="flex-1 p-2 space-y-1 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Dashboard Overview */}
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 group ${
              isActive("/dashboard")
                ? "bg-violet-600/10 text-violet-400 border-l-2 border-violet-500"
                : "text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200"
            }`}
            title={
              !(isExpanded || isMobileMenuOpen) ? "Dashboard Overview" : ""
            }
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {(isExpanded || isMobileMenuOpen) && (
              <span className="text-sm font-medium">Dashboard</span>
            )}
          </Link>

          {/* Competitors Section with Dropdown */}
          <div className="pt-2">
            <button
              onClick={() => setIsCompetitorsOpen(!isCompetitorsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a] rounded-md transition-all duration-200 ${
                !(isExpanded || isMobileMenuOpen) && "justify-center"
              }`}
              title={!(isExpanded || isMobileMenuOpen) ? "Competitors" : ""}
            >
              <div className="flex items-center space-x-3">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {(isExpanded || isMobileMenuOpen) && (
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Competitors
                  </span>
                )}
              </div>
              {(isExpanded || isMobileMenuOpen) && (
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCompetitorsOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {/* Dropdown Content */}
            {isCompetitorsOpen && (
              <div className="space-y-1 mt-1 overflow-hidden">
                {filteredCompetitors.map((competitor) => (
                  <Link
                    key={competitor.id}
                    href={`/dashboard/competitors/${competitor.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 group ${
                      isCompetitorActive(competitor.id)
                        ? "bg-violet-600/10 text-violet-400 border-l-2 border-violet-500"
                        : "text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200"
                    }`}
                    title={
                      !(isExpanded || isMobileMenuOpen) ? competitor.name : ""
                    }
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          competitor.status === "active"
                            ? "bg-green-500 shadow-sm shadow-green-500/50"
                            : "bg-gray-500"
                        }`}
                      />
                      {(isExpanded || isMobileMenuOpen) && (
                        <span className="text-sm truncate">
                          {competitor.name}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Analyze Your Website */}
          <Link
            href="/dashboard/analyze-your-website"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 group ${
              isActive("/dashboard/analyze-your-website")
                ? "bg-violet-600/10 text-violet-400 border-l-2 border-violet-500"
                : "text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200"
            }`}
            title={
              !(isExpanded || isMobileMenuOpen) ? "Analyze Your Website" : ""
            }
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
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
            {(isExpanded || isMobileMenuOpen) && (
              <span className="text-sm font-medium">Analyze Website</span>
            )}
          </Link>
        </nav>
      </div>
    </>
  );
};

export default DashboardSidebar;
