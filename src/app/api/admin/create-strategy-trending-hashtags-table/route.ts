import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const authHeader = req.headers.get("authorization");
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || "admin-secret";

    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create strategy_trending_hashtags table
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        -- Create strategy_trending_hashtags table
        CREATE TABLE IF NOT EXISTS public.strategy_trending_hashtags (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          week_start date NOT NULL,
          hashtags jsonb NOT NULL DEFAULT '[]'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT strategy_trending_hashtags_user_week_unique UNIQUE (user_id, week_start)
        );

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_strategy_trending_hashtags_user_week 
          ON public.strategy_trending_hashtags (user_id, week_start DESC);

        -- Enable RLS
        ALTER TABLE public.strategy_trending_hashtags ENABLE ROW LEVEL SECURITY;

        -- RLS Policy: Users can read their own hashtags
        CREATE POLICY "Users can read own trending hashtags"
          ON public.strategy_trending_hashtags
          FOR SELECT
          USING (user_id = auth.uid());

        -- Trigger to keep updated_at fresh
        CREATE OR REPLACE FUNCTION update_strategy_trending_hashtags_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_strategy_trending_hashtags_updated_at 
          ON public.strategy_trending_hashtags;
        
        CREATE TRIGGER trg_strategy_trending_hashtags_updated_at
          BEFORE UPDATE ON public.strategy_trending_hashtags
          FOR EACH ROW
          EXECUTE FUNCTION update_strategy_trending_hashtags_updated_at();
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Table created successfully",
    });
  } catch (err) {
    console.error("Error creating table:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
