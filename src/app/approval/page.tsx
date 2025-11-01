"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import bgimage from "../../../public/assets/bgimage.jpg";

const ApprovalPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized approval check function
  const checkApprovalStatus = useCallback(async () => {
    // Note: Auth check is handled by middleware
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      // Check user's approval status from the users table
      const { data, error } = await supabase
        .from("users")
        .select("is_approved")
        .eq("id", user.id)
        .single();

      if (error) {
        // Check if it's a "no rows" error (user doesn't exist)
        if (error.code === "PGRST116") {
          console.log("No user record found, creating new user record...");

          // Create new user record with is_approved = false
          const { error: insertError } = await supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            is_approved: false,
            created_at: new Date().toISOString(),
          });

          if (insertError) {
            if (process.env.NODE_ENV === "development") {
              console.error("Error creating user record:", insertError);
            }
            setError(
              "Could not create your account record. Please contact support."
            );
          }
          setChecking(false);
        } else {
          // Other database errors
          if (process.env.NODE_ENV === "development") {
            console.error("Error fetching approval status:", error);
          }
          setError("Unable to check approval status. Please try again.");
          setChecking(false);
        }
      } else if (data?.is_approved === true) {
        // User is approved, redirect to welcome page immediately
        router.replace("/welcome");
        // Don't set checking to false if redirecting
      } else {
        // User not approved, show approval page
        setChecking(false);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Unexpected error checking approval:", err);
      }
      setError("An unexpected error occurred. Please try again.");
      setChecking(false);
    }
  }, [user, router]);

  // Initial approval check
  useEffect(() => {
    checkApprovalStatus();
  }, [checkApprovalStatus]);

  // Poll for approval status changes (simpler than WebSocket)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("is_approved")
          .eq("id", user.id)
          .maybeSingle();

        if (data?.is_approved) {
          clearInterval(interval);
          router.replace("/welcome");
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error polling approval status:", err);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, router]);

  // Memoized logout handler
  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error during logout:", err);
      }
    } finally {
      router.replace("/");
    }
  }, [signOut, router]);

  // Show loading state while checking auth and approval
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Preparing dashboard...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-[var(--font-roboto)]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={bgimage}
          alt="Background"
          placeholder="blur"
          fill
          priority
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Approval Card */}
      <motion.div
        className="relative z-10 w-full max-w-lg mx-4 sm:mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Icon/Logo Area */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#6c63ff] to-[#5a52d5] rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          Awaiting Approval
        </h1>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </motion.div>
        )}

        {/* Subtext */}
        <div className="text-center mb-8 space-y-3">
          <p className="text-lg text-gray-200">
            Hey 👋 Thanks for signing up to LanceIQ.
          </p>
          <p className="text-base text-gray-300 leading-relaxed">
            Your account is under review by our team. You&apos;ll get access
            once approved.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-white/5 border border-white/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-300 text-center">
            💡 This usually takes 1 hour. We&apos;ll notify you once your
            account is approved.
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-6 bg-gradient-to-r from-[#6c63ff] to-[#5a52d5] text-white font-semibold rounded-xl hover:from-[#5a52d5] hover:to-[#4a42c5] transition-all duration-300 transform hover:scale-[1.02] shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
          aria-label="Logout from your account"
        >
          Logout
        </button>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Need help?{" "}
          <a
            href="mailto:lanceiq.help@gmail.com"
            className="text-[#6c63ff] hover:text-[#5a52d5] underline focus:outline-none focus:ring-2 focus:ring-[#6c63ff] rounded"
            aria-label="Contact support via email"
          >
            Contact Support
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default ApprovalPage;
