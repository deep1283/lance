import React from "react";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Navbar from "../components/navbar";

const Home: React.FC = () => {
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
