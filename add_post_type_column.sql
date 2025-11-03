-- Add post_type column to competitor_creatives table
-- Run this in Supabase SQL editor

-- 1) Add the new column
ALTER TABLE public.competitor_creatives 
ADD COLUMN IF NOT EXISTS post_type TEXT;

-- 2) Add media_url column if it doesn't exist
ALTER TABLE public.competitor_creatives 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- 3) Add engagement metrics columns if they don't exist
ALTER TABLE public.competitor_creatives 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE public.competitor_creatives 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

ALTER TABLE public.competitor_creatives 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 4) Infer and set post_type based on existing data
-- For existing records, infer post_type from media_url or carousel_images
UPDATE public.competitor_creatives 
SET post_type = CASE 
  WHEN media_url LIKE '%reel%' OR media_url LIKE '%tv%' THEN 'reel'
  WHEN media_url LIKE '%,%' OR carousel_images IS NOT NULL AND carousel_images != '' THEN 'carousel'
  WHEN video_url IS NOT NULL AND video_url != '' THEN 'reel'
  WHEN carousel_images IS NOT NULL AND carousel_images != '' THEN 'carousel'
  WHEN image_url IS NOT NULL AND image_url != '' THEN 'photo'
  ELSE 'photo'
END
WHERE post_type IS NULL;

-- 5) Backfill media_url for existing records
UPDATE public.competitor_creatives 
SET media_url = CASE 
  WHEN media_url IS NOT NULL AND media_url != '' THEN media_url
  WHEN post_type = 'reel' AND video_url IS NOT NULL THEN video_url
  WHEN post_type = 'photo' AND image_url IS NOT NULL THEN image_url
  WHEN post_type = 'carousel' AND carousel_images IS NOT NULL AND carousel_images != '' THEN carousel_images
  ELSE 'https://via.placeholder.com/400x400?text=No+Media'
END
WHERE media_url IS NULL OR media_url = '';

-- 6) Backfill engagement metrics from engagement_count if available
UPDATE public.competitor_creatives 
SET likes_count = CASE 
  WHEN engagement_count > 0 AND likes_count IS NULL OR likes_count = 0 THEN engagement_count
  ELSE COALESCE(likes_count, 0)
END;

-- 7) Create index for better performance
CREATE INDEX IF NOT EXISTS idx_competitor_creatives_post_type 
ON public.competitor_creatives(post_type);

-- 8) Verify the data
SELECT 
  post_type,
  COUNT(*) as total,
  COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as with_media_url
FROM public.competitor_creatives 
GROUP BY post_type;
