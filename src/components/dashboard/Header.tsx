"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const DashboardHeader: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error during logout:", err);
      }
    } finally {
      router.replace("/");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#1a1a1a] border-b border-gray-700 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <h1 className="text-lg sm:text-xl font-semibold text-white">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs sm:text-sm text-gray-300 truncate">
            Welcome, {user?.email?.split("@")[0] || "User"}
          </div>

          <button
            onClick={handleSignOut}
            className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
