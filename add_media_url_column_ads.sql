-- Add media_url column to competitor_ads table
-- Run this in Supabase SQL editor

-- 1) Add the new column
ALTER TABLE public.competitor_ads 
ADD COLUMN media_url TEXT;

-- 2) Backfill existing data based on ad_type
UPDATE public.competitor_ads 
SET media_url = CASE 
  WHEN ad_type = 'video' AND video_url IS NOT NULL THEN video_url
  WHEN ad_type = 'image' AND image_url IS NOT NULL THEN image_url
  WHEN ad_type = 'carousel' AND carousel_images IS NOT NULL AND carousel_images != '' THEN 
    (SELECT string_agg(img->>'url', ',') FROM jsonb_array_elements(carousel_images::jsonb) AS img)
  ELSE 'https://via.placeholder.com/400x400?text=No+Media' -- fallback for missing media
END;

-- 3) Check for any remaining NULL values
SELECT COUNT(*) as null_count FROM public.competitor_ads WHERE media_url IS NULL;

-- 4) Make the column NOT NULL after backfill (only if no NULLs found)
ALTER TABLE public.competitor_ads 
ALTER COLUMN media_url SET NOT NULL;

-- 5) Add index for better performance
CREATE INDEX IF NOT EXISTS idx_competitor_ads_media_url 
ON public.competitor_ads(media_url);

-- 6) Verify the data
SELECT 
  ad_type,
  COUNT(*) as total,
  COUNT(media_url) as with_media_url,
  COUNT(*) - COUNT(media_url) as missing_media_url
FROM public.competitor_ads 
GROUP BY ad_type;
