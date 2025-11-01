"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import bgimage from "../../../public/assets/bgimage.jpg";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Note: Redirect logic is handled by middleware for consistency

  // Check for error parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const detailsParam = urlParams.get("details");

    if (errorParam) {
      // Sanitize error messages to prevent XSS
      const sanitizedError = errorParam.replace(/[<>]/g, "");
      const sanitizedDetails = detailsParam?.replace(/[<>]/g, "") || "";

      const errorMsg = sanitizedDetails
        ? `Login failed: ${sanitizedError} - ${sanitizedDetails}`
        : `Login failed: ${sanitizedError}`;

      setError(errorMsg);

      // Clean URL after reading error
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  // Handle Google OAuth
  const handleGoogleLogin = useCallback(async () => {
    // Prevent multiple simultaneous login attempts
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // Validate origin before proceeding
      const origin = window.location.origin;
      if (
        !origin.startsWith("http://localhost") &&
        !origin.startsWith("https://")
      ) {
        throw new Error("Invalid origin");
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/approval`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;

      // Note: The redirect happens automatically, so we won't reach here normally
      // But if we do, keep loading state active
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to login with Google. Please try again.";

      if (process.env.NODE_ENV === "development") {
        console.error("Google login error:", err);
      }
      setError(errorMessage);
      setLoading(false);
    }
  }, [loading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
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
        <div className="relative z-10 text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
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

      {/* Login Form */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          Welcome to LanceIQ
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Sign in to continue your journey
        </p>

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

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          aria-label="Sign in with Google"
          className="w-full py-4 px-6 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transform hover:scale-[1.02] shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-lg">
            {loading ? "Signing in..." : "Continue with Google"}
          </span>
        </button>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-gray-300 hover:text-white text-sm underline bg-transparent border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded px-2 py-1"
            aria-label="Back to home page"
          >
            Back to Home
          </button>
        </div>

        {/* Privacy Note */}
        <p className="mt-6 text-xs text-gray-400 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
