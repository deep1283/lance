"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Navbar from "../components/navbar";

const Home: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If logged in, redirect to welcome page
    if (!loading && user) {
      router.push("/welcome");
    }
  }, [user, loading, router]);

  // Show nothing while checking auth or if logged in (will redirect)
  if (loading || user) {
    return null;
  }

  return (
    <main className="flex flex-col">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
};

export default Home;
