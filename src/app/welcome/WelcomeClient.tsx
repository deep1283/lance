"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import bgimage from "../../../public/assets/bgimage.jpg";
import lancelogo from "../../../public/assets/lancelogo.png";

const WelcomeClient: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after 4 seconds
    const redirectTimer = setTimeout(() => {
      router.push("/dashboard");
    }, 4000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  // Animation variants for the quote (stays visible)
  const quoteVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1.5 },
    },
  };

  // Animation variants for the logo (fade in, stay, fade out)
  const logoVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay: 1, duration: 1.2 },
    },
    exit: {
      opacity: 0,
      transition: { delay: 2, duration: 1 },
    },
  };

  // Animation variants for the subtext (appears after logo fades)
  const subtextVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay: 3.5, duration: 1 },
    },
  };

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
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 px-4 sm:px-10">
        {/* Quote - Stays visible throughout */}
        <motion.h1
          className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#C0C0C0] max-w-5xl leading-tight"
          variants={quoteVariants}
          initial="hidden"
          animate="visible"
        >
          You don&apos;t scale by guessing. You scale by tracking who&apos;s
          winning—and outbuilding them.
        </motion.h1>

        {/* Logo - Fades in, stays, then fades out */}
        <motion.div
          className="w-24 sm:w-32 md:w-40"
          variants={logoVariants}
          initial="hidden"
          animate={["visible", "exit"]}
        >
          <Image
            src={lancelogo}
            alt="LanceIQ Logo"
            className="w-full h-auto"
            priority
          />
        </motion.div>

        {/* Subtext - Appears after logo fades */}
        <motion.p
          className="text-lg sm:text-xl text-[#E0E0E0] font-light"
          variants={subtextVariants}
          initial="hidden"
          animate="visible"
        >
          Preparing your dashboard…
        </motion.p>
      </div>
    </div>
  );
};

export default WelcomeClient;

