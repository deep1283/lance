"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import lancelogo from "../../public/assets/lancelogo.png";

const Navbar: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login");
  };

  const handleAbout = () => {
    router.push("/about");
  };

  return (
    <header className="m-0 bg-black h-17 flex items-center justify-between px-3 py-3 space-y-0">
      {/* Logo */}
      <div>
        <Image src={lancelogo} alt="LanceIQ Logo" className="w-28 sm:w-36 h-auto" priority />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleAbout}
          className="bg-[#5425B0] rounded-full text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:scale-105 transition-transform duration-300 hover:cursor-pointer"
        >
          ABOUT US
        </button>

        <button
          onClick={handleGetStarted}
          className="bg-[#5425B0] rounded-full text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:scale-105 transition-transform duration-300 hover:cursor-pointer"
        >
          GET STARTED
        </button>
      </div>

      {/* CTA Button */}
      
    </header>
  );
};

export default Navbar;
