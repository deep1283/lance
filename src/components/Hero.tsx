"use client";

import React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image, { StaticImageData } from "next/image";
import Head from "next/head";
import { useRouter } from "next/navigation";
import DarkVeil from "./DarkVeil";
import ElectricBorder from "./ElectricBorder";
import dashboardImage from "../../public/assets/lance-dashboard.png";
import graphsImage from "../../public/assets/lance-graphs-dashboard.png";
import trendingImage from "../../public/assets/lance-trending-dashboard.png";

const ScrollTiltDashboard: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateX = useSpring(useTransform(scrollYProgress, [0, 1], [-50, 0]), {
    stiffness: 100,
    damping: 20,
  });

  return (
    <motion.div
      ref={ref}
      className="relative w-full max-w-6xl aspect-video"
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "bottom center",
        rotateX,
        perspective: "1000px",
      }}
    >
      <ElectricBorder color="#00f0ff">
        <Image
          src={dashboardImage}
          alt="LanceIQ Dashboard"
          fill
          className="object-contain"
          priority
          quality={85}
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      </ElectricBorder>
    </motion.div>
  );
};

const AnimatedDashboard: React.FC<{
  imageSrc: StaticImageData;
  alt: string;
  direction: "left" | "right";
}> = ({ imageSrc, alt, direction }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateX = useSpring(useTransform(scrollYProgress, [0, 1], [-50, 0]), {
    stiffness: 100,
    damping: 20,
  });

  return (
    <motion.div
      ref={ref}
      className="relative w-full aspect-video"
      initial={{ x: direction === "left" ? -200 : 200, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: "easeOut" }}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "bottom center",
        rotateX,
        perspective: "1000px",
      }}
    >
      <ElectricBorder color="#00f0ff">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className="object-contain"
          quality={85}
        />
      </ElectricBorder>
    </motion.div>
  );
};

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
      </Head>

      {/* Hero Section */}
      <div className="relative flex flex-col justify-center items-center overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0">
          <DarkVeil />
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

      {/* Dashboard Section */}
      <section className="w-full py-8 sm:py-12 md:py-16 bg-black flex flex-col items-center justify-center px-4">
        <ScrollTiltDashboard />
        <div className="w-full max-w-7xl mt-8 sm:mt-12 md:mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedDashboard
            imageSrc={graphsImage}
            alt="LanceIQ Graphs Dashboard"
            direction="left"
          />
          <AnimatedDashboard
            imageSrc={trendingImage}
            alt="LanceIQ Trending Dashboard"
            direction="right"
          />
        </div>
      </section>
    </>
  );
};

export default Hero;
