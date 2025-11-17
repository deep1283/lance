"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  theme?: { color: string };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const highlights = [
  {
    title: "Competitive Intelligence",
    copy: "Track Instagram and Meta ads, organic posts, and viral creatives in one unified dashboard. Every insight is backed by live data from your approved competitors.",
  },
  {
    title: "AI Strategy Layer",
    copy: "Our in-house prompts translate raw performance into clear playbooks—paid ads, organic content, and viral reels. You always know what to copy, test, or outdo.",
  },
  {
    title: "Human Safety Rails",
    copy: "Approval workflows, admin refresh tools, and manual reviews keep sensitive data locked down while still giving you real-time intelligence.",
  },
];

const termsSections = [
  {
    title: "1. Introduction",
    copy:
      "This Agreement defines the terms under which LanceIQ provides marketing data analysis, competitor insights, and keyword intelligence services.",
  },
  {
    title: "2. Scope of Services",
    list: [
      "Competitor Ad & Trend Tracking",
      "Keyword & Hashtag Analysis",
      "Seasonal Trend Forecasting",
      "AI-Based Content and Ad Strategy Insights",
    ],
    copy:
      "Every deliverable is designed to help you make better marketing decisions with AI-driven precision.",
  },
  {
    title: "3. Payment Terms",
    list: [
      "All payments are due in advance before activation.",
      "Fees are non-refundable once data collection or insight generation begins.",
      "Subscriptions auto-renew unless cancelled.",
      "Non-payment may result in suspended access.",
    ],
  },
  {
    title: "4. Confidentiality",
    copy:
      "LanceIQ keeps all client data and reports confidential. Clients agree not to share LanceIQ’s proprietary systems or documentation.",
  },
  {
    title: "5. Data Privacy & Usage",
    copy:
      "We work with anonymised data to improve AI accuracy. No personally identifiable information is shared or sold. All handling complies with Indian data protection guidelines.",
  },
  {
    title: "6. Limitation of Liability",
    copy:
      "We deliver insights and recommendations, but final marketing decisions and outcomes remain the client’s responsibility.",
  },
  {
    title: "7. Termination",
    list: [
      "Either party may terminate with 7 days’ notice.",
      "Outstanding dues must be cleared before termination.",
      "Dashboard access ends once the agreement terminates.",
    ],
  },
  {
    title: "8. Governing Law",
    copy: "The Agreement is governed by and construed under the laws of India.",
  },
  {
    title: "9. Thank You",
    quote:
      "“We’re excited to partner with you on your growth journey. Together, let’s make data work smarter.”",
  },
];

const AboutPage = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "warning" | "error" | null
  >(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setCheckoutReady(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = async () => {
    setCheckoutError(null);
    setPaymentMessage(null);
    setPaymentStatus(null);
    if (!checkoutReady || !window.Razorpay) {
      setCheckoutError("Checkout is still loading. Please try again in a moment.");
      return;
    }
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      setCheckoutError("Razorpay key is not configured.");
      return;
    }
    try {
      setProcessing(true);
      const amount = 100; // ₹4099.00 in paise
      const res = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency: "INR" }),
      });
      const { order, error } = await res.json().catch(() => ({}));
      if (!res.ok || error || !order) {
        setCheckoutError(
          error || "Unable to create Razorpay order. Please try again."
        );
        setProcessing(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "LanceIQ",
        description: "Subscription",
        order_id: order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (verifyRes.ok && verifyJson.valid) {
              setPaymentMessage("Payment verified successfully.");
              setPaymentStatus("success");
            } else {
              setPaymentMessage(
                "Payment received but verification failed. Please contact support."
              );
              setPaymentStatus("warning");
            }
          } catch (err) {
            console.error("Verification error", err);
            setPaymentMessage(
              "Payment received but verification failed. Please contact support."
            );
            setPaymentStatus("warning");
          }
        },
        theme: { color: "#5425B0" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Checkout error", err);
      setCheckoutError("Failed to start checkout. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#0b0620] to-black text-white">
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition"
        >
          <span className="text-xl mr-1">←</span> Back
        </Link>
      </div>
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="uppercase tracking-widest text-violet-300 text-xs mb-6">
          About LanceIQ
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Building the Intelligence Layer for Jewelley Businesses
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto">
          LanceIQ helps jewelry wholesalers and retailers out-plan the market.
          We combine data pipelines, Instagram scrapers, and AI analysts into a
          single experience so you can see what competitors launch, how their
          audiences react, and which plays you should run next.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-6 md:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="bg-[#120b2b]/80 border border-violet-900/30 rounded-3xl p-6 shadow-xl shadow-violet-900/10"
          >
            <h3 className="text-xl font-semibold text-white mb-3">
              {item.title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">{item.copy}</p>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10">
        <div className="bg-[#0f0a1f]/90 rounded-3xl border border-gray-800 p-8 shadow-lg shadow-black/50">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-400 mb-4">
            Terms & Governance
          </p>
          <h2 className="text-3xl font-bold mb-4">Terms & Conditions</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            We operate with transparency: every user must agree to our usage,
            privacy, and data-protection policies before accessing the dashboard
            or any scraped datasets. Review the Terms & Conditions
            (covering acceptable use, cancellations, and support SLAs) any time.
          </p>
          <button
            onClick={() => setShowTerms(true)}
            className="inline-flex items-center justify-center rounded-full border border-violet-500 px-5 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-500/10 transition"
          >
            View Terms & Conditions
          </button>
        </div>

        <div className="bg-[#0f0a1f]/90 rounded-3xl border border-gray-800 p-8 shadow-lg shadow-black/50">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400 mb-4">
            Billing & Payments
          </p>
          <h2 className="text-3xl font-bold mb-4">Payments via Razorpay</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            We are integrating Razorpay for secure subscription billing. Expect
            seamless invoicing, UPI / card / net banking support, GST-ready
            invoices, and automated receipts. Until the gateway goes live, all
            invoices continue to be shared manually by the LanceIQ team.
          </p>
          <ul className="text-sm text-gray-300 space-y-3">
            <li>• PCI-DSS compliant checkout hosted by Razorpay</li>
            <li>• Ability to pause or upgrade plans mid-cycle</li>
            <li>• Automated reminders for upcoming renewals</li>
          </ul>
          <div className="mt-6">
            <button
              onClick={handleCheckout}
              disabled={!checkoutReady || processing}
              className="w-full sm:w-auto px-5 py-3 bg-[#5425B0] text-white font-semibold rounded-full hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Opening Checkout..." : "Pay Securely with Razorpay"}
            </button>
            {paymentMessage && (
              <div
                className={`mt-3 text-sm px-4 py-3 rounded-lg border ${
                  paymentStatus === "success"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-200"
                    : paymentStatus === "warning"
                    ? "bg-amber-500/10 border-amber-500 text-amber-200"
                    : "bg-rose-500/10 border-rose-500 text-rose-200"
                }`}
              >
                {paymentMessage}
              </div>
            )}
            {checkoutError && (
              <p className="text-xs text-red-400 mt-2">{checkoutError}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              You&apos;ll be redirected to Razorpay. 
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-violet-600/20 to-blue-500/10 border border-violet-700/40 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-semibold mb-3">Need something custom?</h3>
          <p className="text-gray-200 mb-6">
            Whether you need a bespoke competitor list, deeper onboarding, or a
            team-wide training session, our crew is a DM away.
          </p>
          <Link
            href="mailto:lanceiq.help@gmail.com"
            className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/20 transition"
          >
            lanceiq.help@gmail.com
          </Link>
        </div>
      </section>
      {showTerms && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTerms(false)}
        >
          <button
            onClick={() => setShowTerms(false)}
            className="fixed top-6 right-6 z-50 bg-white/10 text-white rounded-full px-3 py-1 text-sm hover:bg-white/20 transition"
            aria-label="Close terms modal"
          >
            ✕
          </button>
          <div
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-[#0a0918] border border-violet-800 rounded-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-semibold mb-4 text-white">
              LanceIQ Terms & Conditions
            </h3>
            <div className="space-y-6 text-gray-200 text-sm leading-relaxed">
              {termsSections.map((section) => (
                <div key={section.title} className="bg-white/5 p-4 rounded-xl">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {section.title}
                  </h4>
                  {section.copy && <p>{section.copy}</p>}
                  {section.list && (
                    <ul className="mt-3 space-y-1 list-disc list-inside text-gray-300">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.quote && (
                    <blockquote className="mt-3 italic text-violet-200 border-l-2 border-violet-500 pl-3">
                      {section.quote}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AboutPage;
