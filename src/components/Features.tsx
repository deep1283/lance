"use client";
import React from "react";
import Head from "next/head";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

import bgimage from "../../public/assets/bgimage.jpg";
import creative from "../../public/assets/creative.jpg";
import seo from "../../public/assets/seo.jpg";
import trends from "../../public/assets/trends.jpg";

const fadeIn = (direction: "up" | "down" = "up", delay = 0): Variants => ({
  hidden: { opacity: 0, y: direction === "up" ? 60 : -60 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, delay },
  },
});

const Features: React.FC = () => {
  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>Features | LanceIQ</title>
        <meta
          name="description"
          content="Discover LanceIQ’s powerful competitor tracking, SEO intelligence, and trend analysis tools — built to help you stay ahead in your market."
        />
        <meta
          name="keywords"
          content="Competitor Tracking, SEO Tools, Trend Analysis, Marketing Intelligence, LanceIQ"
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div
        className="h-full bg-cover bg-center py-10 sm:py-20 px-4 sm:px-0"
        style={{
          backgroundImage: `url(${bgimage.src})`,
        }}
      >
        <div className="flex flex-col space-y-16 sm:space-y-24">
          {/* Creative Section */}
          <motion.section
            className="flex flex-col md:flex-row justify-around items-center"
            variants={fadeIn("up", 0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-72 sm:w-80 md:w-96"
            >
              <Image
                src={creative}
                alt="Creative insights feature showing competitor ads and trends"
                className="rounded-3xl shadow-lg"
                placeholder="blur"
                quality={65}
                sizes="(max-width: 768px) 288px, (max-width: 1024px) 320px, 384px"
              />
            </motion.div>
            <div className="text-white text-center md:text-left mt-8 sm:mt-10 md:mt-0 font-[var(--font-roboto)]">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Creatives that Perform
              </h1>
              <p className="w-full sm:w-80 md:w-110 font-extralight text-gray-300">
                Track your competitors&apos; ads, top products, and trends — all
                in one place. Turn insights into action and stay ahead.
              </p>
            </div>
          </motion.section>

          {/* SEO Section */}
          <motion.section
            className="flex flex-col md:flex-row-reverse justify-around items-center"
            variants={fadeIn("up", 0.2)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "100px" }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-72 sm:w-80 md:w-96"
            >
              <Image
                src={seo}
                alt="SEO analysis dashboard showing keyword insights"
                className="rounded-3xl shadow-lg"
                placeholder="blur"
                quality={65}
                sizes="(max-width: 768px) 288px, (max-width: 1024px) 320px, 384px"
              />
            </motion.div>
            <div className="text-white text-center md:text-left mt-8 sm:mt-10 md:mt-0 font-[var(--font-roboto)]">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Outrank. Outshine. Outsmart.
              </h1>
              <p className="w-full sm:w-80 md:w-110 font-extralight text-gray-300">
                See what keywords your competitors rank for and spot
                opportunities to climb higher in search results.
              </p>
            </div>
          </motion.section>

          {/* Trend Section */}
          <motion.section
            className="flex flex-col md:flex-row justify-around items-center"
            variants={fadeIn("up", 0.3)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "100px" }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-72 sm:w-80 md:w-96"
            >
              <Image
                src={trends}
                alt="Trend analysis graph with seasonal marketing spikes"
                className="rounded-3xl shadow-lg"
                placeholder="blur"
                quality={65}
                sizes="(max-width: 768px) 288px, (max-width: 1024px) 320px, 384px"
              />
            </motion.div>
            <div className="text-white text-center md:text-left mt-8 sm:mt-10 md:mt-0 font-[var(--font-roboto)]">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Trend Analysis
              </h1>
              <p className="w-full sm:w-80 md:w-110 font-extralight text-gray-300">
                Get AI-powered trend reports, seasonal spikes, and marketing
                patterns for your industry.
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
};

export default Features;
