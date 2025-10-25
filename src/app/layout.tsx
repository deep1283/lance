import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LanceIQ – AI-Powered Business Growth",
  description:
    "Discover LanceIQ – an AI-powered intelligence system designed to help your business track competitors, analyze trends, and grow faster.",
  keywords: "AI business intelligence, competitor tracking, market analysis, business growth, competitive intelligence, trend analysis",
  authors: [{ name: "LanceIQ" }],
  openGraph: {
    title: "LanceIQ – AI-Powered Business Growth",
    description:
      "Discover LanceIQ – an AI-powered intelligence system designed to help your business track competitors, analyze trends, and grow faster.",
    url: "https://www.lanceiq.com",
    siteName: "LanceIQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LanceIQ – AI-Powered Business Growth",
    description:
      "Discover LanceIQ – an AI-powered intelligence system designed to help your business track competitors, analyze trends, and grow faster.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LanceIQ",
    url: "https://www.lanceiq.com",
    logo: "https://www.lanceiq.com/assets/lancelogo.png",
    description:
      "AI-powered intelligence system designed to help your business track competitors, analyze trends, and grow faster.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "support@lanceiq.com",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
