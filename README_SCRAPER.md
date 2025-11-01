# Instagram Hashtag Scraper

## ✅ What's Ready

- ✅ Puppeteer installed
- ✅ Scraper script created (`instagram-scraper.js`)
- ✅ **Mobile + Web scraping** (best of both worlds)
- ✅ Auto-login with credentials
- ✅ Reel prioritization
- ✅ Full captions with hashtags
- ✅ CSV output format you need
- ✅ Top 10 results (was 5)
- ✅ Error handling & reliability

## 🎯 To Use It

### Step 1: Create Instagram Account
- Business account for scraping
- Keep it active

### Step 2: Add Credentials
Create `.env.local` in `lance/` folder:
```
INSTAGRAM_EMAIL=your_email@gmail.com
INSTAGRAM_PASSWORD=your_password
INSTAGRAM_USERNAME=your_username
```

### Step 3: Run
```bash
cd lance
node instagram-scraper.js jewellery
```

Output: `jewellery_2025-01-16.csv`

## 📊 What You Get

CSV with columns:
- Hashtag
- url  
- likes (empty - fill manually)
- comments (empty - fill manually)
- Caption (empty - fill manually)

**Top 10 posts** (reels first, then carousels)

**Note:** Only URLs are extracted automatically. You fill in likes, comments, and captions manually by visiting each URL.

## ⚠️ Important

1. First run downloads Chromium (~300MB) - takes 2-3 mins
2. Don't run too frequently (Instagram rate limits)
3. Use a real, active Instagram account
4. Review CSV before uploading to Supabase

## 🚀 That's It!

**Scrapes both mobile + web** → Deduplicates → Reels prioritized → Top 10 URLs → CSV → You fill manually → Upload to Supabase

Takes ~40-60 seconds (no detail fetching)

See `SCRAPER_SETUP.md` for detailed troubleshooting.

