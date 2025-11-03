-- Clean up duplicate RLS policies and indexes
-- Run this in Supabase SQL editor

-- 1. Drop duplicate policies from competitor_ads
DROP POLICY IF EXISTS "Users can view competitor ads" ON public.competitor_ads;
DROP POLICY IF EXISTS "Users see ads of their competitors" ON public.competitor_ads;
DROP POLICY IF EXISTS "Users see their competitors ads" ON public.competitor_ads;

-- 2. Drop duplicate policies from competitor_creatives
DROP POLICY IF EXISTS "Users can view competitor creatives" ON public.competitor_creatives;
DROP POLICY IF EXISTS "Users see creatives of their competitors" ON public.competitor_creatives;
DROP POLICY IF EXISTS "Users see their competitors creatives" ON public.competitor_creatives;

-- 3. Drop duplicate policies from competitor_websites
DROP POLICY IF EXISTS "Users can view competitor websites" ON public.competitor_websites;
DROP POLICY IF EXISTS "Users see their competitors websites" ON public.competitor_websites;
DROP POLICY IF EXISTS "Users see website analysis of their competitors" ON public.competitor_websites;

-- 4. Drop duplicate policies from competitors
DROP POLICY IF EXISTS "Allow authenticated users to read competitors" ON public.competitors;
DROP POLICY IF EXISTS "Authenticated users can read competitors" ON public.competitors;
DROP POLICY IF EXISTS "Users can view their competitors" ON public.competitors;
DROP POLICY IF EXISTS "Users see assigned competitors" ON public.competitors;

-- 5. Drop duplicate policies from user_competitors
DROP POLICY IF EXISTS "Users can view their competitor assignments" ON public.user_competitors;
DROP POLICY IF EXISTS "Users can view their own competitor assignments" ON public.user_competitors;
DROP POLICY IF EXISTS "Users see their own competitors" ON public.user_competitors;

-- 6. Create single unified policies

-- competitor_ads: Users can see ads of their competitors
CREATE POLICY "Users can see competitor ads"
  ON public.competitor_ads FOR SELECT
  USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors WHERE user_id = auth.uid()
    )
  );

-- competitor_creatives: Users can see creatives of their competitors
CREATE POLICY "Users can see competitor creatives"
  ON public.competitor_creatives FOR SELECT
  USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors WHERE user_id = auth.uid()
    )
  );

-- competitor_websites: Users can see website analysis of their competitors
CREATE POLICY "Users can see competitor websites"
  ON public.competitor_websites FOR SELECT
  USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors WHERE user_id = auth.uid()
    )
  );

-- competitors: Users can see their assigned competitors
CREATE POLICY "Users can see assigned competitors"
  ON public.competitors FOR SELECT
  USING (
    id IN (
      SELECT competitor_id FROM public.user_competitors WHERE user_id = auth.uid()
    )
  );

-- user_competitors: Users can see their own competitor assignments
CREATE POLICY "Users can see their own competitor assignments"
  ON public.user_competitors FOR SELECT
  USING (user_id = auth.uid());

-- 7. Drop duplicate indexes
DROP INDEX IF EXISTS public.idx_competitor_ads_competitor_id;
DROP INDEX IF EXISTS public.idx_competitor_creatives_competitor_id;
DROP INDEX IF EXISTS public.competitor_top_posts_competitor_id_idx1;
DROP INDEX IF EXISTS public.idx_user_competitors_user_id;

-- 8. Verify cleanup
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('competitor_ads', 'competitor_creatives', 'competitor_websites', 'competitors', 'user_competitors')
ORDER BY tablename, policyname;
