"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const descriptionParam = searchParams.get("error_description");

    if (errorParam) {
      const message = encodeURIComponent(
        descriptionParam || errorParam || "Login was cancelled"
      );
      router.replace(`/?authError=${message}`);
      return;
    }

    const processAuth = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login?error=auth");
        return;
      }

      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("is_approved")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError) {
        router.replace("/login?error=auth");
        return;
      }

      if (!existingUser) {
        await supabase.from("users").upsert({
          id: user.id,
          email: user.email,
          is_approved: false,
          created_at: new Date().toISOString(),
        });
        router.replace("/approval");
        return;
      }

      if (existingUser.is_approved) {
        router.replace("/welcome");
      } else {
        router.replace("/approval");
      }
    };

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      Redirecting…
    </div>
  );
}

