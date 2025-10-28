"use client";

import React, { useEffect, useState } from "react";
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
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const checkApprovalStatus = async () => {
      // If no user, redirect to login
      if (!authLoading && !user) {
        router.push("/login");
        return;
      }

      if (user) {
        try {
          // Check user's approval status from the users table
          const { data, error } = await supabase
            .from("users")
            .select("is_approved")
            .eq("id", user.id)
            .single();

          if (error) {
            // If no user record exists, create one with is_approved = false
            console.log("No user record found, creating new user record...");
            const { error: insertError } = await supabase.from("users").insert({
              id: user.id,
              email: user.email,
              is_approved: false,
              created_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error("Error creating user record:", insertError);
            }
            setIsApproved(false);
          } else if (data?.is_approved === true) {
            // User is approved, redirect to welcome page first
            setIsApproved(true);
            router.push("/welcome");
          } else {
            // User is not approved, stay on this page
            setIsApproved(false);
          }
        } catch (err) {
          console.warn("Error checking approval:", err);
          setIsApproved(false);
        } finally {
          setChecking(false);
        }
      }
    };

    checkApprovalStatus();
  }, [user, authLoading, router]);

  // Subscribe to approval status changes and auto-redirect when approved
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-approval-watch-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const approved = (
            payload as unknown as { new?: { is_approved?: boolean } }
          ).new?.is_approved;
          if (approved === true) {
            setIsApproved(true);
            // Hard navigation for mobile reliability
            try {
              router.replace("/welcome");
            } catch (_) {}
            if (typeof window !== "undefined") {
              window.location.replace("/welcome");
            }
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  // Show loading state while checking auth and approval
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Preparing dashboard...</div>
      </div>
    );
  }

  // If user is approved, they'll be redirected, so show loading
  if (isApproved) {
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
          className="w-full py-3 px-6 bg-gradient-to-r from-[#6c63ff] to-[#5a52d5] text-white font-semibold rounded-xl hover:from-[#5a52d5] hover:to-[#4a42c5] transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
        >
          Logout
        </button>

        {/* Footer Text */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Need help?{" "}
          <a
            href="mailto:support@lanceiq.com"
            className="text-[#6c63ff] hover:text-[#5a52d5] underline"
          >
            Contact Support
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default ApprovalPage;
