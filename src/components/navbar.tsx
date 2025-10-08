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

  return (
    <header className="m-0  bg-black h-17 flex items-center justify-between px-3">
      {/* Logo */}
      <div>
        <Image src={lancelogo} alt="LanceIQ Logo" className="w-36" priority />
      </div>

      {/* CTA Button */}
      <div>
        <button
          onClick={handleGetStarted}
          className="bg-[#5425B0] rounded-2xl text-white px-4 py-2 mr-3 hover:scale-105 transition-transform duration-300 hover:cursor-pointer"
        >
          GET STARTED
        </button>
      </div>
    </header>
  );
};

export default Navbar;
