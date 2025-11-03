-- Update did_you_know table to support industry-based sharing
-- Run this in Supabase SQL editor

-- 1) Add industry column
ALTER TABLE public.did_you_know 
ADD COLUMN IF NOT EXISTS industry TEXT;

-- 2) Make user_id nullable for shared industry-based notes
-- First, we need to remove the constraint, alter the column, then re-add constraint if needed
ALTER TABLE public.did_you_know 
ALTER COLUMN user_id DROP NOT NULL;

-- 3) Add check constraint: either user_id OR industry must be set
ALTER TABLE public.did_you_know 
ADD CONSTRAINT did_you_know_user_or_industry_check 
CHECK (
  (user_id IS NOT NULL AND industry IS NULL) OR 
  (user_id IS NULL AND industry IS NOT NULL) OR
  (user_id IS NOT NULL AND industry IS NOT NULL)
);

-- 4) Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_did_you_know_industry_date
  ON public.did_you_know (industry, date DESC)
  WHERE industry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_did_you_know_user_id_date
  ON public.did_you_know (user_id, date DESC)
  WHERE user_id IS NOT NULL;

-- 5) Update RLS policy to allow reading industry-based shared notes
DROP POLICY IF EXISTS "Read own did_you_know" ON public.did_you_know;

CREATE POLICY "Read own did_you_know"
  ON public.did_you_know FOR SELECT
  USING (
    -- Users can see their personal notes
    user_id = auth.uid() 
    OR
    -- Users can see industry-shared notes if they have a matching industry in their profile
    (
      industry IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid() 
        AND (user_profiles.industry = public.did_you_know.industry OR user_profiles.niche = public.did_you_know.industry)
      )
    )
  );

-- 6) Verify the migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) FILTER (WHERE industry IS NOT NULL) as industry_shared_notes,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as personal_notes,
  COUNT(*) as total_notes
FROM public.did_you_know;
