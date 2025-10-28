"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/navigation";
import bgimage from "../../public/assets/bgimage.jpg";
const lancevideo = "/assets/lancevideo.mp4";

const Hero: React.FC = () => {
  const router = useRouter();

  const handleStartTrial = () => {
    router.push("/login");
  };

  return (
    <>
      {/* SEO Head Metadata */}
      <Head>
        <title>LanceIQ – AI-Powered Business Growth</title>
        <meta
          name="description"
          content="Discover LanceIQ – an AI-powered intelligence system designed to help your business track competitors, analyze trends, and grow faster."
        />
        <meta
          name="keywords"
          content="AI marketing, business growth, trend analysis, competitor tracking, LanceIQ"
        />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="LanceIQ – AI-Powered Business Growth"
        />
        <meta
          property="og:description"
          content="Turn insights into action with LanceIQ – the ultimate AI-driven intelligence platform for marketers and business owners."
        />
        <meta property="og:type" content="website" />
        <link rel="preload" as="image" href={bgimage.src} />
        <link rel="preload" as="video" href={lancevideo} />
      </Head>

      {/* Hero Section */}
      <div className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={bgimage}
            alt="Background"
            placeholder="blur"
            fill
            priority
            quality={65}
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-10">
          <motion.h1
            className="text-white text-4xl sm:text-6xl md:text-7xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            AI-Powered Intelligence
          </motion.h1>

          <motion.h2
            className="text-white text-4xl sm:text-6xl md:text-7xl mt-2 font-bold"
            initial={{ opacity: 0, y: 20, color: "#ccc" }}
            animate={{ opacity: 1, y: 0, color: "#ffffff" }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            for Business Growth
          </motion.h2>

          <motion.button
            onClick={handleStartTrial}
            className="mt-6 sm:mt-8 rounded-xl py-2 px-4 sm:py-3 sm:px-6 text-sm sm:text-base bg-gray-300 border font-semibold text-gray-900 cursor-pointer hover:scale-105 hover:bg-white transition-all duration-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.9,
              duration: 1.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            Start Free Trial
          </motion.button>
        </div>
      </div>

      {/* Video Section */}
      <motion.section
        className="w-full h-[100vh] sm:h-screen overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "200px" }}
        transition={{ duration: 1.5 }}
      >
        <video
          src={lancevideo}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          className="w-full h-full object-cover"
        />
      </motion.section>
    </>
  );
};

export default Hero;
