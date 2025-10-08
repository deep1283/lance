import React from "react";
import Head from "next/head";

const Footer: React.FC = () => {
  return (
    <>
      {/* Optional Footer Meta */}
      <Head>
        <meta name="author" content="LanceIQ" />
      </Head>

      <footer className="flex justify-center items-center h-14 bg-gray-900 text-white">
        <p className="font-extralight text-sm sm:text-base">
          &copy; LanceIQ 2025. All rights reserved.
        </p>
      </footer>
    </>
  );
};

export default Footer;
