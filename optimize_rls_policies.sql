-- Optimize RLS policies by using (SELECT auth.uid()) instead of auth.uid()
-- Run this in Supabase SQL editor

-- 1. Drop duplicate analyzed_websites policies
DROP POLICY IF EXISTS "Users can view their own websites" ON public.analyzed_websites;
DROP POLICY IF EXISTS "Users see own analyzed websites" ON public.analyzed_websites;

-- Create single optimized policy for analyzed_websites
CREATE POLICY "Users can see their own analyzed websites"
  ON public.analyzed_websites FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own analyzed websites"
  ON public.analyzed_websites FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own analyzed websites"
  ON public.analyzed_websites FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 2. Recreate optimized policies for competitor_ads
DROP POLICY IF EXISTS "Users can see competitor ads" ON public.competitor_ads;
CREATE POLICY "Users can see competitor ads"
  ON public.competitor_ads FOR SELECT
  USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- 3. Recreate optimized policies for competitor_creatives
DROP POLICY IF EXISTS "Users can see competitor creatives" ON public.competitor_creatives;
CREATE POLICY "Users can see competitor creatives"
  ON public.competitor_creatives FOR SELECT
  USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- 4. Recreate optimized policies for competitor_websites
DROP POLICY IF EXISTS "Users can see competitor websites" ON public.competitor_websites;
CREATE POLICY "Users can see competitor websites"
  ON public.competitor_websites FOR SELECT
  USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- 5. Recreate optimized policies for competitors
DROP POLICY IF EXISTS "Users can see assigned competitors" ON public.competitors;
CREATE POLICY "Users can see assigned competitors"
  ON public.competitors FOR SELECT
  USING (
    id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- 6. Recreate optimized policies for user_competitors
DROP POLICY IF EXISTS "Users can see their own competitor assignments" ON public.user_competitors;
DROP POLICY IF EXISTS "Users can insert their own competitor assignments" ON public.user_competitors;

CREATE POLICY "Users can see their own competitor assignments"
  ON public.user_competitors FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own competitor assignments"
  ON public.user_competitors FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 7. Recreate optimized policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 8. Recreate optimized policies for ai_analyses
DROP POLICY IF EXISTS "Users can view their competitor analyses" ON public.ai_analyses;
DROP POLICY IF EXISTS "Users can insert analyses for their competitors" ON public.ai_analyses;
DROP POLICY IF EXISTS "Users can update analyses for their competitors" ON public.ai_analyses;

CREATE POLICY "Users can view their competitor analyses"
  ON public.ai_analyses FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) AND 
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert analyses for their competitors"
  ON public.ai_analyses FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND 
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update analyses for their competitors"
  ON public.ai_analyses FOR UPDATE
  USING (
    user_id = (SELECT auth.uid()) AND 
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND 
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- 9. Recreate optimized policies for users table
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- 10. Recreate optimized policy for competitor_top_posts
DROP POLICY IF EXISTS "competitor top posts" ON public.competitor_top_posts;
CREATE POLICY "Users can see competitor top posts"
  ON public.competitor_top_posts FOR SELECT
  USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- 11. Recreate optimized policy for strategy_trending_hashtags
DROP POLICY IF EXISTS "Users can read own trending hashtags" ON public.strategy_trending_hashtags;
CREATE POLICY "Users can read own trending hashtags"
  ON public.strategy_trending_hashtags FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- 12. Recreate optimized policy for strategy_trending_keywords
DROP POLICY IF EXISTS "Users can read own trending keywords" ON public.strategy_trending_keywords;
CREATE POLICY "Users can read own trending keywords"
  ON public.strategy_trending_keywords FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- 13. Recreate optimized policy for strategy_trending_analysis
DROP POLICY IF EXISTS "Users can read own trending analysis" ON public.strategy_trending_analysis;
CREATE POLICY "Users can read own trending analysis"
  ON public.strategy_trending_analysis FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- 14. Recreate optimized policy for strategy_competitors
DROP POLICY IF EXISTS "Read own strategy_competitors" ON public.strategy_competitors;
CREATE POLICY "Read own strategy_competitors"
  ON public.strategy_competitors FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- 15. Recreate optimized policy for did_you_know
DROP POLICY IF EXISTS "Read own did_you_know" ON public.did_you_know;
CREATE POLICY "Read own did_you_know"
  ON public.did_you_know FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) 
    OR
    (
      industry IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = (SELECT auth.uid()) 
        AND (user_profiles.industry = public.did_you_know.industry OR user_profiles.niche = public.did_you_know.industry)
      )
    )
  );

-- 16. Verify optimization
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'competitor_ads', 'competitor_creatives', 'competitor_websites', 
    'competitors', 'user_competitors', 'user_profiles', 'ai_analyses',
    'users', 'competitor_top_posts', 'strategy_trending_hashtags',
    'strategy_trending_keywords', 'strategy_trending_analysis',
    'strategy_competitors', 'did_you_know', 'analyzed_websites'
  )
ORDER BY tablename, policyname;

