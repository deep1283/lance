"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface UserAnalysis {
  userId: string;
  email: string;
  competitorId: string;
  analysisType: string;
  lastRefreshed: string;
  daysOld: number;
}

interface User {
  id: string;
  email: string;
}

const AdminDashboard: React.FC = () => {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState<UserAnalysis[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [strategyRefreshing, setStrategyRefreshing] = useState<string | null>(
    null
  );

  // Check authentication
  const handleAuthenticate = () => {
    const validToken = process.env.NEXT_PUBLIC_ADMIN_SECRET || "admin-secret";
    if (token === validToken) {
      setAuthenticated(true);
      fetchUsers();
      fetchAllUsers();
    } else {
      alert("Invalid token");
    }
  };

  // Fetch all users for Strategy Lab section
  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${
            process.env.NEXT_PUBLIC_ADMIN_SECRET || "admin-secret"
          }`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching all users:", err);
    }
  };

  // Fetch users with old analyses
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Use fetch to call the API which has proper auth context
      const response = await fetch("/api/admin/analyses");
      if (!response.ok) {
        throw new Error("Failed to fetch analyses");
      }
      const data = await response.json();

      const analysesData = data.analyses;

      // Get unique user IDs from analyses
      const userIds = [
        ...new Set(analysesData?.map((a: any) => a.user_id) || []),
      ];

      // Fetch user emails
      const { data: userEmails, error: emailError } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);

      if (emailError) {
        // Handle email fetch error silently
      }

      const emailMap = new Map<string, string>();
      userEmails?.forEach((user) => {
        emailMap.set(user.id, user.email);
      });

      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

      const userMap = new Map<string, UserAnalysis>();

      // If we have analyses, process them
      if (analysesData && analysesData.length > 0) {
        for (const analysis of analysesData) {
          const createdAt = new Date(analysis.created_at).getTime();
          const daysOld = Math.floor(
            (Date.now() - createdAt) / (24 * 60 * 60 * 1000)
          );

          const key = `${analysis.user_id}-${analysis.analysis_type}`;
          if (
            !userMap.has(key) ||
            createdAt < new Date(userMap.get(key)!.lastRefreshed).getTime()
          ) {
            userMap.set(key, {
              userId: analysis.user_id,
              email: emailMap.get(analysis.user_id) || analysis.user_id,
              competitorId: analysis.competitor_id,
              analysisType: analysis.analysis_type,
              lastRefreshed: analysis.created_at,
              daysOld,
            });
          }
        }
      }

      setUsers(Array.from(userMap.values()));
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to fetch users: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh analysis for a specific user
  const handleRefresh = async (
    userId: string,
    competitorId: string,
    analysisType: string
  ) => {
    setRefreshing(`${userId}-${analysisType}`);
    try {
      const response = await fetch("/api/admin/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          competitorId,
          analysisType,
          userId,
        }),
      });

      if (response.ok) {
        alert("Analysis refreshed successfully!");
        fetchUsers(); // Refresh the list
      } else {
        alert("Failed to refresh analysis");
      }
    } catch (err) {
      console.error("Error refreshing:", err);
      alert("Error refreshing analysis");
    } finally {
      setRefreshing(null);
    }
  };

  // Strategy Lab refresh
  const handleStrategyRefresh = async (userId: string) => {
    setStrategyRefreshing(userId);
    try {
      const response = await fetch("/api/admin/strategy-competitors/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refresh strategy");
      }

      alert("Strategy insights generated successfully!");
    } catch (error) {
      alert("Failed to refresh strategy: " + (error as Error).message);
    } finally {
      setStrategyRefreshing(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-800 p-8 rounded-lg">
          <h1 className="text-white text-2xl mb-4">Admin Access</h1>
          <input
            type="password"
            placeholder="Enter admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded mb-4"
          />
          <button
            onClick={handleAuthenticate}
            className="w-full py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Strategy Lab Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Strategy Lab - Competitor Insights
        </h2>
        <p className="text-gray-300 mb-4">
          Generate competitor insights (top hashtags, keywords, creatives) for
          the last 10 days.
        </p>
        <div className="space-y-3">
          {allUsers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : (
            allUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">
                    {user.email}
                  </div>
                  <div className="text-gray-400 text-xs font-mono">
                    {user.id}
                  </div>
                </div>
                <button
                  onClick={() => handleStrategyRefresh(user.id)}
                  disabled={strategyRefreshing === user.id}
                  className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50 text-white font-medium text-sm"
                >
                  {strategyRefreshing === user.id
                    ? "Generating..."
                    : "Generate Strategy"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          AI Analysis Refresh
        </h2>

        <div className="mb-4">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 bg-violet-600 rounded hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh List"}
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">
              No AI analyses found in the database yet.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Analyses will appear here once users generate them in their
              dashboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-700">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-4 py-2 border border-gray-700">
                    User Email
                  </th>
                  <th className="px-4 py-2 border border-gray-700">User ID</th>
                  <th className="px-4 py-2 border border-gray-700">
                    Competitor ID
                  </th>
                  <th className="px-4 py-2 border border-gray-700">
                    Analysis Type
                  </th>
                  <th className="px-4 py-2 border border-gray-700">
                    Last Refreshed
                  </th>
                  <th className="px-4 py-2 border border-gray-700">Days Old</th>
                  <th className="px-4 py-2 border border-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={index}
                    className={user.daysOld > 2 ? "bg-red-900/20" : ""}
                  >
                    <td className="px-4 py-2 border border-gray-700 text-sm">
                      {user.email}
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-xs font-mono">
                      {user.userId}
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-xs font-mono">
                      {user.competitorId}
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-sm">
                      {user.analysisType}
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-sm">
                      {new Date(user.lastRefreshed).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-sm">
                      {user.daysOld}
                    </td>
                    <td className="px-4 py-2 border border-gray-700">
                      <button
                        onClick={() =>
                          handleRefresh(
                            user.userId,
                            user.competitorId,
                            user.analysisType
                          )
                        }
                        disabled={
                          refreshing === `${user.userId}-${user.analysisType}`
                        }
                        className="px-3 py-1 bg-violet-600 rounded hover:bg-violet-700 disabled:opacity-50 text-sm"
                      >
                        {refreshing === `${user.userId}-${user.analysisType}`
                          ? "Refreshing..."
                          : "Refresh"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
