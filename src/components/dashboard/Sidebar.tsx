"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import lancelogo from "../../../public/assets/lancelogo.png";
import lanceSymbol from "../../../public/assets/lanceIQ-symbol.png";
import { Competitor } from "@/types/dashboard";

interface SidebarProps {
  competitors: Competitor[];
}

const DashboardSidebar: React.FC<SidebarProps> = ({ competitors }) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [competitorsOpen, setCompetitorsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredCompetitors = competitors.filter((c) =>
    c?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0a0a0e] border border-[#2a2a2a] rounded-lg"
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
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`fixed left-0 top-0 h-screen bg-[#0a0a0e] border-r border-[#1a1a1a] flex flex-col z-40 transition-all duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${isExpanded ? "w-60" : "w-16"}`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-center">
          <motion.div
            animate={{
              filter: "drop-shadow(0 0 8px #6c63ff)",
            }}
            transition={{ duration: 0.3 }}
          >
            {isExpanded ? (
              <Image
                src={lancelogo}
                alt="LanceIQ"
                className="w-32"
                width={128}
                height={32}
                priority
              />
            ) : (
              <Image
                src={lanceSymbol}
                alt="LanceIQ Symbol"
                className="w-8 h-8"
                width={32}
                height={32}
                priority
              />
            )}
          </motion.div>
        </div>

        {/* Search - only when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3"
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6c63ff]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2">
          {/* Competitors */}
          <div className="mb-4">
            <button
              onClick={() => setCompetitorsOpen(!competitorsOpen)}
              className={`w-full flex items-center ${
                isExpanded ? "justify-between" : "justify-center"
              } px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all`}
              title={!isExpanded ? "Competitors" : ""}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
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
                {isExpanded && <span>Competitors</span>}
              </div>
              {isExpanded && (
                <svg
                  className={`w-4 h-4 transition-transform ${
                    competitorsOpen ? "rotate-90" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {isExpanded && competitorsOpen && (
              <div className="mt-1 space-y-1">
                {filteredCompetitors.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/dashboard/competitors/${comp.id}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                      pathname.includes(comp.id)
                        ? "bg-[#6c63ff]/10 text-[#6c63ff] border-l-2 border-[#6c63ff]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        comp.status === "active"
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    />
                    {comp.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Analyze Website */}
          <Link
            href="/dashboard/analyze-your-website"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center ${
              isExpanded ? "gap-2" : "justify-center"
            } px-3 py-2 text-sm rounded-lg transition-all ${
              pathname === "/dashboard/analyze-your-website"
                ? "bg-[#6c63ff]/10 text-[#6c63ff] border-l-2 border-[#6c63ff]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            title={!isExpanded ? "Analyze Website" : ""}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {isExpanded && <span>Analyze Your Website</span>}
          </Link>
        </nav>
      </motion.div>
    </>
  );
};

export default DashboardSidebar;
