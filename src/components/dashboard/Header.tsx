"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const DashboardHeader: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-10 bg-[#0a0a0e]/70 backdrop-blur-sm border-b border-[#1a1a1a] px-4 sm:px-6 py-3 sm:py-4 ml-16 lg:ml-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-medium truncate">
            Welcome, {user?.email?.split("@")[0] || "User"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Last synced: Just now
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-[#2a2a2a] rounded-lg transition-all whitespace-nowrap"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
