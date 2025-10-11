"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import bgimage from "../../../public/assets/bgimage.jpg";

const LoginPage: React.FC = () => {
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check for error parameters in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const detailsParam = urlParams.get("details");
    if (errorParam) {
      const errorMsg = detailsParam
        ? `Login failed: ${errorParam} - ${detailsParam}`
        : `Login failed: ${errorParam}`;
      setError(errorMsg);
    }
  }, []);

  // Handle Phone OTP Send
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhoneNumber,
      });

      if (error) throw error;

      setOtpSent(true);
      setSuccess("OTP sent successfully! Please check your phone.");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const { error } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      setSuccess("Login successful! Redirecting...");
      // Redirect to approval page
      window.location.href = "/approval";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth (Simple Supabase approach)
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/approval`,
        },
      });

      if (error) throw error;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to login with Google. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
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
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Login Form */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          Welcome to LanceIQ
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Sign in to continue your journey
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* Phone Login Form */}
        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-4 mb-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="flex space-x-2">
                {/* Country Code Dropdown */}
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-3 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[80px]"
                >
                  <option value="+91" className="bg-gray-800">
                    🇮🇳 +91
                  </option>
                  <option value="+1" className="bg-gray-800">
                    🇺🇸 +1
                  </option>
                  <option value="+44" className="bg-gray-800">
                    🇬🇧 +44
                  </option>
                  <option value="+61" className="bg-gray-800">
                    🇦🇺 +61
                  </option>
                  <option value="+49" className="bg-gray-800">
                    🇩🇪 +49
                  </option>
                  <option value="+33" className="bg-gray-800">
                    🇫🇷 +33
                  </option>
                  <option value="+81" className="bg-gray-800">
                    🇯🇵 +81
                  </option>
                  <option value="+86" className="bg-gray-800">
                    🇨🇳 +86
                  </option>
                  <option value="+55" className="bg-gray-800">
                    🇧🇷 +55
                  </option>
                  <option value="+52" className="bg-gray-800">
                    🇲🇽 +52
                  </option>
                  <option value="+39" className="bg-gray-800">
                    🇮🇹 +39
                  </option>
                  <option value="+34" className="bg-gray-800">
                    🇪🇸 +34
                  </option>
                  <option value="+31" className="bg-gray-800">
                    🇳🇱 +31
                  </option>
                  <option value="+46" className="bg-gray-800">
                    🇸🇪 +46
                  </option>
                  <option value="+47" className="bg-gray-800">
                    🇳🇴 +47
                  </option>
                  <option value="+45" className="bg-gray-800">
                    🇩🇰 +45
                  </option>
                  <option value="+41" className="bg-gray-800">
                    🇨🇭 +41
                  </option>
                  <option value="+43" className="bg-gray-800">
                    🇦🇹 +43
                  </option>
                  <option value="+32" className="bg-gray-800">
                    🇧🇪 +32
                  </option>
                  <option value="+351" className="bg-gray-800">
                    🇵🇹 +351
                  </option>
                  <option value="+90" className="bg-gray-800">
                    🇹🇷 +90
                  </option>
                  <option value="+7" className="bg-gray-800">
                    🇷🇺 +7
                  </option>
                  <option value="+82" className="bg-gray-800">
                    🇰🇷 +82
                  </option>
                  <option value="+65" className="bg-gray-800">
                    🇸🇬 +65
                  </option>
                  <option value="+60" className="bg-gray-800">
                    🇲🇾 +60
                  </option>
                  <option value="+66" className="bg-gray-800">
                    🇹🇭 +66
                  </option>
                  <option value="+84" className="bg-gray-800">
                    🇻🇳 +84
                  </option>
                  <option value="+63" className="bg-gray-800">
                    🇵🇭 +63
                  </option>
                  <option value="+62" className="bg-gray-800">
                    🇮🇩 +62
                  </option>
                  <option value="+27" className="bg-gray-800">
                    🇿🇦 +27
                  </option>
                  <option value="+20" className="bg-gray-800">
                    🇪🇬 +20
                  </option>
                  <option value="+234" className="bg-gray-800">
                    🇳🇬 +234
                  </option>
                  <option value="+254" className="bg-gray-800">
                    🇰🇪 +254
                  </option>
                  <option value="+233" className="bg-gray-800">
                    🇬🇭 +233
                  </option>
                  <option value="+212" className="bg-gray-800">
                    🇲🇦 +212
                  </option>
                  <option value="+213" className="bg-gray-800">
                    🇩🇿 +213
                  </option>
                  <option value="+216" className="bg-gray-800">
                    🇹🇳 +216
                  </option>
                  <option value="+218" className="bg-gray-800">
                    🇱🇾 +218
                  </option>
                  <option value="+220" className="bg-gray-800">
                    🇬🇲 +220
                  </option>
                  <option value="+221" className="bg-gray-800">
                    🇸🇳 +221
                  </option>
                  <option value="+223" className="bg-gray-800">
                    🇲🇱 +223
                  </option>
                  <option value="+224" className="bg-gray-800">
                    🇬🇳 +224
                  </option>
                  <option value="+225" className="bg-gray-800">
                    🇨🇮 +225
                  </option>
                  <option value="+226" className="bg-gray-800">
                    🇧🇫 +226
                  </option>
                  <option value="+227" className="bg-gray-800">
                    🇳🇪 +227
                  </option>
                  <option value="+228" className="bg-gray-800">
                    🇹🇬 +228
                  </option>
                  <option value="+229" className="bg-gray-800">
                    🇧🇯 +229
                  </option>
                  <option value="+230" className="bg-gray-800">
                    🇲🇺 +230
                  </option>
                  <option value="+231" className="bg-gray-800">
                    🇱🇷 +231
                  </option>
                  <option value="+232" className="bg-gray-800">
                    🇸🇱 +232
                  </option>
                  <option value="+235" className="bg-gray-800">
                    🇹🇩 +235
                  </option>
                  <option value="+236" className="bg-gray-800">
                    🇨🇫 +236
                  </option>
                  <option value="+237" className="bg-gray-800">
                    🇨🇲 +237
                  </option>
                  <option value="+238" className="bg-gray-800">
                    🇨🇻 +238
                  </option>
                  <option value="+239" className="bg-gray-800">
                    🇸🇹 +239
                  </option>
                  <option value="+240" className="bg-gray-800">
                    🇬🇶 +240
                  </option>
                  <option value="+241" className="bg-gray-800">
                    🇬🇦 +241
                  </option>
                  <option value="+242" className="bg-gray-800">
                    🇨🇬 +242
                  </option>
                  <option value="+243" className="bg-gray-800">
                    🇨🇩 +243
                  </option>
                  <option value="+244" className="bg-gray-800">
                    🇦🇴 +244
                  </option>
                  <option value="+245" className="bg-gray-800">
                    🇬🇼 +245
                  </option>
                  <option value="+246" className="bg-gray-800">
                    🇮🇴 +246
                  </option>
                  <option value="+248" className="bg-gray-800">
                    🇸🇨 +248
                  </option>
                  <option value="+249" className="bg-gray-800">
                    🇸🇩 +249
                  </option>
                  <option value="+250" className="bg-gray-800">
                    🇷🇼 +250
                  </option>
                  <option value="+251" className="bg-gray-800">
                    🇪🇹 +251
                  </option>
                  <option value="+252" className="bg-gray-800">
                    🇸🇴 +252
                  </option>
                  <option value="+253" className="bg-gray-800">
                    🇩🇯 +253
                  </option>
                  <option value="+255" className="bg-gray-800">
                    🇹🇿 +255
                  </option>
                  <option value="+256" className="bg-gray-800">
                    🇺🇬 +256
                  </option>
                  <option value="+257" className="bg-gray-800">
                    🇧🇮 +257
                  </option>
                  <option value="+258" className="bg-gray-800">
                    🇲🇿 +258
                  </option>
                  <option value="+260" className="bg-gray-800">
                    🇿🇲 +260
                  </option>
                  <option value="+261" className="bg-gray-800">
                    🇲🇬 +261
                  </option>
                  <option value="+262" className="bg-gray-800">
                    🇷🇪 +262
                  </option>
                  <option value="+263" className="bg-gray-800">
                    🇿🇼 +263
                  </option>
                  <option value="+264" className="bg-gray-800">
                    🇳🇦 +264
                  </option>
                  <option value="+265" className="bg-gray-800">
                    🇲🇼 +265
                  </option>
                  <option value="+266" className="bg-gray-800">
                    🇱🇸 +266
                  </option>
                  <option value="+267" className="bg-gray-800">
                    🇧🇼 +267
                  </option>
                  <option value="+268" className="bg-gray-800">
                    🇸🇿 +268
                  </option>
                  <option value="+269" className="bg-gray-800">
                    🇰🇲 +269
                  </option>
                  <option value="+290" className="bg-gray-800">
                    🇸🇭 +290
                  </option>
                  <option value="+291" className="bg-gray-800">
                    🇪🇷 +291
                  </option>
                  <option value="+297" className="bg-gray-800">
                    🇦🇼 +297
                  </option>
                  <option value="+298" className="bg-gray-800">
                    🇫🇴 +298
                  </option>
                  <option value="+299" className="bg-gray-800">
                    🇬🇱 +299
                  </option>
                  <option value="+350" className="bg-gray-800">
                    🇬🇮 +350
                  </option>
                  <option value="+352" className="bg-gray-800">
                    🇱🇺 +352
                  </option>
                  <option value="+353" className="bg-gray-800">
                    🇮🇪 +353
                  </option>
                  <option value="+354" className="bg-gray-800">
                    🇮🇸 +354
                  </option>
                  <option value="+355" className="bg-gray-800">
                    🇦🇱 +355
                  </option>
                  <option value="+356" className="bg-gray-800">
                    🇲🇹 +356
                  </option>
                  <option value="+357" className="bg-gray-800">
                    🇨🇾 +357
                  </option>
                  <option value="+358" className="bg-gray-800">
                    🇫🇮 +358
                  </option>
                  <option value="+359" className="bg-gray-800">
                    🇧🇬 +359
                  </option>
                  <option value="+370" className="bg-gray-800">
                    🇱🇹 +370
                  </option>
                  <option value="+371" className="bg-gray-800">
                    🇱🇻 +371
                  </option>
                  <option value="+372" className="bg-gray-800">
                    🇪🇪 +372
                  </option>
                  <option value="+373" className="bg-gray-800">
                    🇲🇩 +373
                  </option>
                  <option value="+374" className="bg-gray-800">
                    🇦🇲 +374
                  </option>
                  <option value="+375" className="bg-gray-800">
                    🇧🇾 +375
                  </option>
                  <option value="+376" className="bg-gray-800">
                    🇦🇩 +376
                  </option>
                  <option value="+377" className="bg-gray-800">
                    🇲🇨 +377
                  </option>
                  <option value="+378" className="bg-gray-800">
                    🇸🇲 +378
                  </option>
                  <option value="+380" className="bg-gray-800">
                    🇺🇦 +380
                  </option>
                  <option value="+381" className="bg-gray-800">
                    🇷🇸 +381
                  </option>
                  <option value="+382" className="bg-gray-800">
                    🇲🇪 +382
                  </option>
                  <option value="+383" className="bg-gray-800">
                    🇽🇰 +383
                  </option>
                  <option value="+385" className="bg-gray-800">
                    🇭🇷 +385
                  </option>
                  <option value="+386" className="bg-gray-800">
                    🇸🇮 +386
                  </option>
                  <option value="+387" className="bg-gray-800">
                    🇧🇦 +387
                  </option>
                  <option value="+389" className="bg-gray-800">
                    🇲🇰 +389
                  </option>
                  <option value="+420" className="bg-gray-800">
                    🇨🇿 +420
                  </option>
                  <option value="+421" className="bg-gray-800">
                    🇸🇰 +421
                  </option>
                  <option value="+423" className="bg-gray-800">
                    🇱🇮 +423
                  </option>
                  <option value="+500" className="bg-gray-800">
                    🇫🇰 +500
                  </option>
                  <option value="+501" className="bg-gray-800">
                    🇧🇿 +501
                  </option>
                  <option value="+502" className="bg-gray-800">
                    🇬🇹 +502
                  </option>
                  <option value="+503" className="bg-gray-800">
                    🇸🇻 +503
                  </option>
                  <option value="+504" className="bg-gray-800">
                    🇭🇳 +504
                  </option>
                  <option value="+505" className="bg-gray-800">
                    🇳🇮 +505
                  </option>
                  <option value="+506" className="bg-gray-800">
                    🇨🇷 +506
                  </option>
                  <option value="+507" className="bg-gray-800">
                    🇵🇦 +507
                  </option>
                  <option value="+508" className="bg-gray-800">
                    🇵🇲 +508
                  </option>
                  <option value="+509" className="bg-gray-800">
                    🇭🇹 +509
                  </option>
                  <option value="+590" className="bg-gray-800">
                    🇬🇵 +590
                  </option>
                  <option value="+591" className="bg-gray-800">
                    🇧🇴 +591
                  </option>
                  <option value="+592" className="bg-gray-800">
                    🇬🇾 +592
                  </option>
                  <option value="+593" className="bg-gray-800">
                    🇪🇨 +593
                  </option>
                  <option value="+594" className="bg-gray-800">
                    🇬🇫 +594
                  </option>
                  <option value="+595" className="bg-gray-800">
                    🇵🇾 +595
                  </option>
                  <option value="+596" className="bg-gray-800">
                    🇲🇶 +596
                  </option>
                  <option value="+597" className="bg-gray-800">
                    🇸🇷 +597
                  </option>
                  <option value="+598" className="bg-gray-800">
                    🇺🇾 +598
                  </option>
                  <option value="+599" className="bg-gray-800">
                    🇧🇶 +599
                  </option>
                  <option value="+670" className="bg-gray-800">
                    🇹🇱 +670
                  </option>
                  <option value="+672" className="bg-gray-800">
                    🇦🇶 +672
                  </option>
                  <option value="+673" className="bg-gray-800">
                    🇧🇳 +673
                  </option>
                  <option value="+674" className="bg-gray-800">
                    🇳🇷 +674
                  </option>
                  <option value="+675" className="bg-gray-800">
                    🇵🇬 +675
                  </option>
                  <option value="+676" className="bg-gray-800">
                    🇹🇴 +676
                  </option>
                  <option value="+677" className="bg-gray-800">
                    🇸🇧 +677
                  </option>
                  <option value="+678" className="bg-gray-800">
                    🇻🇺 +678
                  </option>
                  <option value="+679" className="bg-gray-800">
                    🇫🇯 +679
                  </option>
                  <option value="+680" className="bg-gray-800">
                    🇵🇼 +680
                  </option>
                  <option value="+681" className="bg-gray-800">
                    🇼🇫 +681
                  </option>
                  <option value="+682" className="bg-gray-800">
                    🇨🇰 +682
                  </option>
                  <option value="+683" className="bg-gray-800">
                    🇳🇺 +683
                  </option>
                  <option value="+684" className="bg-gray-800">
                    🇦🇸 +684
                  </option>
                  <option value="+685" className="bg-gray-800">
                    🇼🇸 +685
                  </option>
                  <option value="+686" className="bg-gray-800">
                    🇰🇮 +686
                  </option>
                  <option value="+687" className="bg-gray-800">
                    🇳🇨 +687
                  </option>
                  <option value="+688" className="bg-gray-800">
                    🇹🇻 +688
                  </option>
                  <option value="+689" className="bg-gray-800">
                    🇵🇫 +689
                  </option>
                  <option value="+690" className="bg-gray-800">
                    🇹🇰 +690
                  </option>
                  <option value="+691" className="bg-gray-800">
                    🇫🇲 +691
                  </option>
                  <option value="+692" className="bg-gray-800">
                    🇲🇭 +692
                  </option>
                  <option value="+850" className="bg-gray-800">
                    🇰🇵 +850
                  </option>
                  <option value="+852" className="bg-gray-800">
                    🇭🇰 +852
                  </option>
                  <option value="+853" className="bg-gray-800">
                    🇲🇴 +853
                  </option>
                  <option value="+855" className="bg-gray-800">
                    🇰🇭 +855
                  </option>
                  <option value="+856" className="bg-gray-800">
                    🇱🇦 +856
                  </option>
                  <option value="+880" className="bg-gray-800">
                    🇧🇩 +880
                  </option>
                  <option value="+886" className="bg-gray-800">
                    🇹🇼 +886
                  </option>
                  <option value="+960" className="bg-gray-800">
                    🇲🇻 +960
                  </option>
                  <option value="+961" className="bg-gray-800">
                    🇱🇧 +961
                  </option>
                  <option value="+962" className="bg-gray-800">
                    🇯🇴 +962
                  </option>
                  <option value="+963" className="bg-gray-800">
                    🇸🇾 +963
                  </option>
                  <option value="+964" className="bg-gray-800">
                    🇮🇶 +964
                  </option>
                  <option value="+965" className="bg-gray-800">
                    🇰🇼 +965
                  </option>
                  <option value="+966" className="bg-gray-800">
                    🇸🇦 +966
                  </option>
                  <option value="+967" className="bg-gray-800">
                    🇾🇪 +967
                  </option>
                  <option value="+968" className="bg-gray-800">
                    🇴🇲 +968
                  </option>
                  <option value="+970" className="bg-gray-800">
                    🇵🇸 +970
                  </option>
                  <option value="+971" className="bg-gray-800">
                    🇦🇪 +971
                  </option>
                  <option value="+972" className="bg-gray-800">
                    🇮🇱 +972
                  </option>
                  <option value="+973" className="bg-gray-800">
                    🇧🇭 +973
                  </option>
                  <option value="+974" className="bg-gray-800">
                    🇶🇦 +974
                  </option>
                  <option value="+975" className="bg-gray-800">
                    🇧🇹 +975
                  </option>
                  <option value="+976" className="bg-gray-800">
                    🇲🇳 +976
                  </option>
                  <option value="+977" className="bg-gray-800">
                    🇳🇵 +977
                  </option>
                  <option value="+992" className="bg-gray-800">
                    🇹🇯 +992
                  </option>
                  <option value="+993" className="bg-gray-800">
                    🇹🇲 +993
                  </option>
                  <option value="+994" className="bg-gray-800">
                    🇦🇿 +994
                  </option>
                  <option value="+995" className="bg-gray-800">
                    🇬🇪 +995
                  </option>
                  <option value="+996" className="bg-gray-800">
                    🇰🇬 +996
                  </option>
                  <option value="+998" className="bg-gray-800">
                    🇺🇿 +998
                  </option>
                </select>

                {/* Phone Number Input */}
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Only numbers
                    if (value.length <= 10) {
                      setPhoneNumber(value);
                    }
                  }}
                  maxLength={10}
                  required
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Enter your 10-digit mobile number
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4 mb-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setPhoneNumber("");
                setError("");
              }}
              className="w-full text-gray-300 hover:text-white text-sm underline"
            >
              Change phone number
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 text-gray-300 bg-transparent">OR</span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-6 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transform hover:scale-[1.02]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{loading ? "Signing in..." : "Continue with Google"}</span>
        </button>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-gray-300 hover:text-white text-sm underline bg-transparent border-none cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
