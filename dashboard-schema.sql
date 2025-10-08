-- LanceIQ Dashboard Schema
-- Run this in Supabase SQL Editor

-- Competitors table (global)
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  industry TEXT,
  status TEXT DEFAULT 'active', -- active/inactive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Competitor mapping (personalized)
CREATE TABLE IF NOT EXISTS public.user_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, competitor_id)
);

-- Competitor Meta Ads
CREATE TABLE IF NOT EXISTS public.competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'meta', -- meta, google, youtube
  ad_title TEXT,
  ad_copy TEXT,
  image_url TEXT,
  cta_text TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor Social Creatives (Organic)
CREATE TABLE IF NOT EXISTS public.competitor_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  platform TEXT, -- instagram, facebook, twitter
  post_url TEXT,
  image_url TEXT,
  caption TEXT,
  engagement_count INT DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor Website Analysis
CREATE TABLE IF NOT EXISTS public.competitor_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  speed_score INT,
  keywords JSONB,
  meta_tags JSONB,
  gpt_analysis TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client's Own Website Analysis
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

-- Enable RLS
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyzed_websites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see their own competitors"
  ON public.user_competitors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users see own analyzed websites"
  ON public.analyzed_websites FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_competitors ON public.user_competitors(user_id);
CREATE INDEX idx_competitor_ads ON public.competitor_ads(competitor_id);
CREATE INDEX idx_competitor_creatives ON public.competitor_creatives(competitor_id);

