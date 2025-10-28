-- Add media_url column to competitor_creatives table
-- Run this in Supabase SQL editor

-- 1) Add the new column
ALTER TABLE public.competitor_creatives 
ADD COLUMN media_url TEXT;

-- 2) Backfill existing data based on post_type
UPDATE public.competitor_creatives 
SET media_url = CASE 
  WHEN post_type = 'reel' AND video_url IS NOT NULL THEN video_url
  WHEN post_type = 'photo' AND image_url IS NOT NULL THEN image_url
  WHEN post_type = 'carousel' AND carousel_images IS NOT NULL AND carousel_images != '' THEN carousel_images
  ELSE 'https://via.placeholder.com/400x400?text=No+Media' -- fallback for missing media
END;

-- 3) Check for any remaining NULL values
SELECT COUNT(*) as null_count FROM public.competitor_creatives WHERE media_url IS NULL;

-- 4) Make the column NOT NULL after backfill (only if no NULLs found)
ALTER TABLE public.competitor_creatives 
ALTER COLUMN media_url SET NOT NULL;

-- 4) Add index for better performance
CREATE INDEX IF NOT EXISTS idx_competitor_creatives_media_url 
ON public.competitor_creatives(media_url);

-- 5) Verify the data
SELECT 
  post_type,
  COUNT(*) as total,
  COUNT(media_url) as with_media_url,
  COUNT(*) - COUNT(media_url) as missing_media_url
FROM public.competitor_creatives 
GROUP BY post_type;
