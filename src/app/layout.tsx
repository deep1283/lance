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
  title: "LanceIQ – AI Competitor & Keyword Intelligence for Meta & Instagram",
  description:
    "LanceIQ helps brands uncover competitor ad insights, discover trending hashtags, and get AI-generated keyword suggestions for Meta and Instagram – all in one intelligent dashboard.",
  keywords:
    "AI keyword suggestions, Meta ads analysis, Instagram trend insights, competitor tracking, ad intelligence, content keyword optimization, hashtag analytics, marketing intelligence platform, social media growth AI",
  authors: [{ name: "LanceIQ" }],
  openGraph: {
    title:
      "LanceIQ – AI Competitor & Keyword Intelligence for Meta & Instagram",
    description:
      "Analyze competitors, discover trending hashtags, and get AI-powered keyword suggestions for Meta and Instagram to boost reach and engagement.",
    url: "https://www.lanceiq.com",
    siteName: "LanceIQ",
    type: "website",
    images: [
      {
        url: "https://www.lanceiq.com/assets/og-banner.png",
        width: 1200,
        height: 630,
        alt: "LanceIQ Dashboard Preview – AI Keyword Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "LanceIQ – AI Competitor & Keyword Intelligence for Meta & Instagram",
    description:
      "LanceIQ provides AI-driven competitor insights, trending hashtags, and keyword suggestions for Meta and Instagram to help your brand grow faster.",
    images: ["https://www.lanceiq.com/assets/og-banner.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "https://www.lanceiq.com",
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
    sameAs: [
      "https://www.instagram.com/lanceiq/",
      "https://www.linkedin.com/company/lanceiq/",
    ],
    description:
      "LanceIQ is an AI-powered marketing intelligence platform that helps businesses track competitors, analyze Meta ads, and generate smart keyword and hashtag suggestions for better visibility and engagement.",
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
