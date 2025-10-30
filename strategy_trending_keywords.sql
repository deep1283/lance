-- Strategy Lab: Trending Keywords Table
-- Run this in Supabase SQL Editor

-- Create strategy_trending_keywords table
CREATE TABLE IF NOT EXISTS public.strategy_trending_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT strategy_trending_keywords_user_week_unique UNIQUE (user_id, week_start)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_strategy_trending_keywords_user_week 
  ON public.strategy_trending_keywords (user_id, week_start DESC);

-- Enable RLS
ALTER TABLE public.strategy_trending_keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own keywords
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'strategy_trending_keywords'
      AND policyname = 'Users can read own trending keywords'
  ) THEN
    CREATE POLICY "Users can read own trending keywords"
      ON public.strategy_trending_keywords
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END$$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_strategy_trending_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_strategy_trending_keywords_updated_at 
  ON public.strategy_trending_keywords;

CREATE TRIGGER trg_strategy_trending_keywords_updated_at
  BEFORE UPDATE ON public.strategy_trending_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_trending_keywords_updated_at();

