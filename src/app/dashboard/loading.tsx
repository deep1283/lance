import React from "react";

const DashboardLoading: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
};

export default DashboardLoading;
