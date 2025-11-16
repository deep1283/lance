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
  p_post_type TEXT,
  p_followers BIGINT,
  p_paid BOOLEAN
)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  likes_val     DECIMAL := COALESCE(p_likes, 0);
  comments_val  DECIMAL := COALESCE(p_comments, 0);
  views_val     DECIMAL := NULLIF(p_views, 0);
  followers_val DECIMAL := NULLIF(p_followers, 0);
  wc            DECIMAL := 3;
  k             DECIMAL := 500;
  t             DECIMAL := 50;
  wb            DECIMAL;
  mb            DECIMAL;
  er            DECIMAL;
  ner           DECIMAL;
  ve            DECIMAL;
  erf           DECIMAL;
  nerf          DECIMAL;
  vfl           DECIMAL;
  rps           DECIMAL;
BEGIN
  wb := CASE WHEN COALESCE(p_paid, false) THEN 0.05 ELSE 0.15 END;
  mb := CASE WHEN COALESCE(p_paid, false) THEN 0.90 ELSE 1.00 END;

  -- Reels/Videos
  IF p_post_type IN ('reel', 'video') AND views_val IS NOT NULL THEN
    er := (likes_val + (wc * comments_val)) / views_val;
    ner := 100 * LN(1 + k * er) / LN(1 + t);
    ner := GREATEST(0, LEAST(100, ner));

    IF followers_val IS NOT NULL THEN
      ve := 100 * LN(1 + (views_val / followers_val)) / LN(1 + 50);
      ve := GREATEST(0, LEAST(100, ve));
    ELSE
      ve := 0;
    END IF;

    rps := mb * ((0.9 * ner) + (wb * ve));
    RETURN rps;
  END IF;

  -- Images/Carousels
  IF followers_val IS NOT NULL THEN
    erf := (likes_val + (wc * comments_val)) / followers_val;
    nerf := 100 * LN(1 + k * erf) / LN(1 + t);
    nerf := GREATEST(0, LEAST(100, nerf));
  ELSE
    nerf := 0;
  END IF;

  vfl := 100 * LOG(10, likes_val + 1) / LOG(10, 100000);
  vfl := GREATEST(0, LEAST(100, vfl));

  rps := mb * ((0.9 * nerf) + (0.1 * vfl));
  RETURN rps;
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
    NEW.post_type,
    NEW.followers,
    NEW.paid
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
