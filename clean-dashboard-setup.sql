-- Clean Dashboard Setup for LanceIQ
-- This will drop existing policies and recreate everything fresh

-- ============================================================
-- DROP EXISTING POLICIES FIRST
-- ============================================================
DROP POLICY IF EXISTS "Users can view their competitors" ON public.competitors;
DROP POLICY IF EXISTS "Users can view their competitor assignments" ON public.user_competitors;
DROP POLICY IF EXISTS "Users can view competitor ads" ON public.competitor_ads;
DROP POLICY IF EXISTS "Users can view competitor creatives" ON public.competitor_creatives;
DROP POLICY IF EXISTS "Users can view competitor websites" ON public.competitor_websites;
DROP POLICY IF EXISTS "Users can view their own websites" ON public.analyzed_websites;
DROP POLICY IF EXISTS "Service role full access" ON public.competitors;
DROP POLICY IF EXISTS "Service role full access user_competitors" ON public.user_competitors;
DROP POLICY IF EXISTS "Service role full access ads" ON public.competitor_ads;
DROP POLICY IF EXISTS "Service role full access creatives" ON public.competitor_creatives;

-- ============================================================
-- CREATE TABLES (IF NOT EXISTS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  industry TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, competitor_id)
);

CREATE TABLE IF NOT EXISTS public.competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'meta',
  ad_title TEXT,
  ad_copy TEXT,
  image_url TEXT,
  cta_text TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  library_id TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.competitor_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  platform TEXT,
  post_url TEXT,
  image_url TEXT,
  caption TEXT,
  engagement_count INT DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.competitor_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  speed_score INT,
  keywords JSONB,
  meta_tags JSONB,
  gpt_analysis TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analyzed_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  speed_score INT,
  keywords JSONB,
  meta_tags JSONB,
  gpt_analysis TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyzed_websites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE FRESH RLS POLICIES
-- ============================================================

-- Competitors policies
CREATE POLICY "Users can view their competitors" ON public.competitors
  FOR SELECT USING (
    id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access" ON public.competitors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User-Competitor assignments
CREATE POLICY "Users can view their competitor assignments" ON public.user_competitors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access user_competitors" ON public.user_competitors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Competitor ads
CREATE POLICY "Users can view competitor ads" ON public.competitor_ads
  FOR SELECT USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access ads" ON public.competitor_ads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Competitor creatives
CREATE POLICY "Users can view competitor creatives" ON public.competitor_creatives
  FOR SELECT USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access creatives" ON public.competitor_creatives
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Competitor websites
CREATE POLICY "Users can view competitor websites" ON public.competitor_websites
  FOR SELECT USING (
    competitor_id IN (
      SELECT competitor_id FROM public.user_competitors 
      WHERE user_id = auth.uid()
    )
  );

-- Analyzed websites
CREATE POLICY "Users can view their own websites" ON public.analyzed_websites
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- CREATE INDEXES (IF NOT EXISTS)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_competitors_user_id ON public.user_competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_competitors_competitor_id ON public.user_competitors(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_competitor_id ON public.competitor_ads(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_creatives_competitor_id ON public.competitor_creatives(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_websites_competitor_id ON public.competitor_websites(competitor_id);
CREATE INDEX IF NOT EXISTS idx_analyzed_websites_user_id ON public.analyzed_websites(user_id);

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.competitors TO service_role;
GRANT ALL ON public.user_competitors TO service_role;
GRANT ALL ON public.competitor_ads TO service_role;
GRANT ALL ON public.competitor_creatives TO service_role;
GRANT ALL ON public.competitor_websites TO service_role;
GRANT ALL ON public.analyzed_websites TO service_role;

GRANT SELECT ON public.competitors TO authenticated;
GRANT SELECT ON public.user_competitors TO authenticated;
GRANT SELECT ON public.competitor_ads TO authenticated;
GRANT SELECT ON public.competitor_creatives TO authenticated;
GRANT SELECT ON public.competitor_websites TO authenticated;
GRANT SELECT ON public.analyzed_websites TO authenticated;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Dashboard setup complete!';
  RAISE NOTICE '   - All tables created/verified';
  RAISE NOTICE '   - RLS policies recreated';
  RAISE NOTICE '   - Indexes created';
  RAISE NOTICE '   - Permissions granted';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '   1. Login at http://localhost:3000/login';
  RAISE NOTICE '   2. Approve user in Supabase Table Editor';
  RAISE NOTICE '   3. Run: node onboard-customer-args.js';
END $$;
