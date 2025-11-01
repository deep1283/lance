# Instagram Scraper Setup Guide

## 🚀 Quick Start

### 1. Install Puppeteer

```bash
cd lance
npm install
```

### 2. Create Instagram Account

Create a separate Instagram business account for scraping:

- Use a real email
- Add a profile picture
- Keep it active by posting occasionally

### 3. Set Up Credentials

Create a `.env.local` file in the `lance/` directory:

```bash
INSTAGRAM_EMAIL=your_instagram_email@example.com
INSTAGRAM_PASSWORD=your_instagram_password
INSTAGRAM_USERNAME=your_instagram_username
```

**⚠️ Important:** Never commit `.env.local` to git!

### 4. Run the Scraper

```bash
node instagram-scraper.js jewellery
```

### 5. Output

The scraper will create a CSV file named:

```
jewellery_2025-01-16.csv
```

## 📋 How It Works

1. **Login**: Automatically logs into Instagram using your credentials
2. **Mobile Scrape**: Opens hashtag page with mobile viewport to get reels
3. **Web Scrape**: Opens same hashtag with desktop viewport to get carousels/images
4. **Deduplicate**: Removes duplicate posts found in both views
5. **Prioritize**: Combines results (reels first, then carousels)
6. **Generate CSV**: Saves top 10 URLs only (empty columns for manual entry)
7. **Manual Entry**: You fill in likes, comments, and captions by visiting URLs

## 🔧 Features

- ✅ **Mobile + Web Scraping**: Gets best of both worlds (reels + carousels)
- ✅ **URL-Only Extraction**: Fast scraping, no rate limiting from detail fetching
- ✅ **Deduplication**: Removes duplicate posts intelligently
- ✅ **Top 10 Results**: Returns top 10 posts instead of just 5
- ✅ **Reel Prioritization**: Reels shown first, then carousels
- ✅ **Auto-login**: Handles all Instagram login flows
- ✅ **Rate Limit Protection**: 30-second delay between mobile and web scrape
- ✅ **Error Handling**: Graceful failures with detailed logs
- ✅ **Headless**: Runs in background, no browser window needed
- ✅ **Manual Data Entry**: You control quality of likes/comments/captions

## ⚠️ Important Notes

1. **Don't run too frequently** - Instagram may flag suspicious activity
2. **Use legitimate account** - Don't use fake accounts
3. **Keep it manual for MVP** - Just run when you need data
4. **First run might be slow** - Puppeteer downloads Chromium (~300MB)
5. **Handle popups** - Script handles "Save Info" and "Notifications" dialogs

## 🐛 Troubleshooting

### "Instagram credentials not found"

- Make sure `.env.local` exists in `lance/` directory
- Check that credentials are correctly formatted

### "No posts found"

- Instagram might require login verification
- Check your account isn't restricted
- Try running with `headless: false` to see what's happening

### "Timeout errors"

- Instagram is slow - script waits 60 seconds by default
- Check your internet connection
- Instagram might be rate-limiting you

### "Browser errors"

- First run downloads Chromium (~300MB)
- Make sure you have stable internet
- On Mac, you might need to allow Chrome in System Preferences

## 📊 CSV Output Format

```csv
Hashtag,url,likes,comments,Caption
"#jewellery","https://www.instagram.com/reel/ABC123/","","",""
"#jewellery","https://www.instagram.com/p/XYZ789/","","",""
```

You fill in the empty columns manually by visiting each URL.

## 🎯 Next Steps

After you get the CSV:

1. Open CSV in Excel/Google Sheets
2. Visit each URL manually
3. Fill in likes, comments, and captions
4. Save CSV and upload to Supabase
5. Update trending tables
6. Display in dashboard

## 💡 Future Enhancements

- [ ] Auto-upload to Supabase
- [ ] Batch multiple hashtags
- [ ] Schedule daily runs
- [ ] Email notifications
- [ ] Better carousel detection
