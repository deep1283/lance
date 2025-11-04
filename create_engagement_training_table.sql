-- Engagement Prediction Training Data Table
-- Run this in Supabase SQL Editor
-- General-purpose table for training on any trending Instagram posts (not competitor-specific)
--
-- WORKFLOW:
-- 1. Collect and label posts (1+ months of training data)
-- 2. Train AI model and store predictions in predicted_score column
-- 3. Compare predicted_score vs engagement_score to measure accuracy
-- 4. Do NOT show predictions to users on dashboard during testing phase
-- 5. Only show to users once model accuracy is validated and approved

CREATE TABLE IF NOT EXISTS public.engagement_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic post data
  post_url TEXT NOT NULL UNIQUE,
  post_type TEXT NOT NULL CHECK (post_type IN ('reel', 'video', 'image', 'carousel')),
  
  -- Engagement metrics
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  
  -- Engagement scores
  engagement_score DECIMAL(5,2), -- Actual engagement score (calculated from metrics)
  predicted_score DECIMAL(5,2), -- AI model predicted score (for testing/validation)
  
  -- Manual labels (no constraints - allow any text values)
  theme TEXT,
  tone TEXT,
  format TEXT CHECK (format IN ('Reel', 'Story', 'Static Image', 'Carousel', 'Video')),
  cta_present BOOLEAN DEFAULT FALSE,
  dominant_color TEXT,
  music_type TEXT,
  language TEXT DEFAULT 'English',
  
  -- Content
  caption TEXT,
  
  -- Metadata
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Embeddings (will store OpenAI embeddings as JSONB)
  caption_embedding JSONB,
  
  -- Training metadata
  is_labeled BOOLEAN DEFAULT FALSE,
  labeled_at TIMESTAMP WITH TIME ZONE,
  labeled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Prediction metadata (for testing phase - not shown to users yet)
  has_prediction BOOLEAN DEFAULT FALSE,
  prediction_made_at TIMESTAMP WITH TIME ZONE,
  model_version TEXT, -- Store model version used for prediction
  prediction_accuracy DECIMAL(5,2), -- Difference between predicted and actual score
  
  -- Timestamps
  posted_at DATE, -- Date when post was posted on Instagram (date only, no time)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_engagement_training_post_url ON public.engagement_training_data(post_url);
CREATE INDEX IF NOT EXISTS idx_engagement_training_post_type ON public.engagement_training_data(post_type);
CREATE INDEX IF NOT EXISTS idx_engagement_training_labeled ON public.engagement_training_data(is_labeled);
CREATE INDEX IF NOT EXISTS idx_engagement_training_user ON public.engagement_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_training_posted_at ON public.engagement_training_data(posted_at);
CREATE INDEX IF NOT EXISTS idx_engagement_training_has_prediction ON public.engagement_training_data(has_prediction);

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_likes INT,
  p_comments INT,
  p_views INT,
  p_post_type TEXT
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  raw_score DECIMAL;
  normalized_score DECIMAL;
  min_score DECIMAL;
  max_score DECIMAL;
BEGIN
  -- For videos/reels (with views)
  IF p_post_type IN ('reel', 'video') AND p_views > 0 THEN
    RETURN ((p_likes::DECIMAL + (3 * p_comments::DECIMAL)) / p_views::DECIMAL) * 100;
  
  -- For images/carousels (no views, needs normalization later)
  ELSE
    -- Return raw score (will be normalized during training)
    RETURN (p_likes::DECIMAL + (3 * p_comments::DECIMAL));
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update engagement_score when metrics change
CREATE OR REPLACE FUNCTION update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.engagement_score = calculate_engagement_score(
    NEW.likes_count,
    NEW.comments_count,
    NEW.views_count,
    NEW.post_type
  );
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engagement_score
  BEFORE INSERT OR UPDATE OF likes_count, comments_count, views_count, post_type
  ON public.engagement_training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_score();

-- Enable RLS
ALTER TABLE public.engagement_training_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies (updated - no competitor_id references)
CREATE POLICY "Users can view their training data"
  ON public.engagement_training_data FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);

CREATE POLICY "Users can insert their training data"
  ON public.engagement_training_data FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);

CREATE POLICY "Users can update their training data"
  ON public.engagement_training_data FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);

CREATE POLICY "Service role full access"
  ON public.engagement_training_data FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Engagement training data table created successfully!';
  RAISE NOTICE '   - No constraints on theme/tone (any text allowed)';
  RAISE NOTICE '   - No competitor_id (general/trending posts)';
  RAISE NOTICE '   - posted_at is DATE type only (no time)';
  RAISE NOTICE '   - Added predicted_score column for AI model testing';
  RAISE NOTICE '   - Prediction metadata columns for validation tracking';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  REMEMBER: Do NOT show predictions on dashboard during testing phase!';
  RAISE NOTICE '   Only show to users after model validation (1+ months of data).';
END $$;
