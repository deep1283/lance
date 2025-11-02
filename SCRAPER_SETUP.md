# Instagram Manual Login Scraper Setup Guide

## 🚀 Quick Start

### 1. Dependencies Installed

All required packages are already installed:
- `puppeteer` - Browser automation
- `puppeteer-extra` - Enhanced Puppeteer
- `puppeteer-extra-plugin-stealth` - Anti-detection
- `dotenv` - Environment variables (not required for this scraper)

### 2. Run the Scraper

```bash
cd lance
node instagram-manual-login-scraper.js jewellery 10
```

That's it! No credentials needed in `.env.local`.

### 3. Manual Login Process

When the browser opens:

1. **Log in** with your Instagram credentials
2. **Complete 2FA** if prompted
3. **Click "Not Now"** on "Save Login Info" prompt
4. **Click "Not Now"** on notifications prompt
5. **Wait** on the Instagram home page

The scraper will automatically detect when you're logged in (max 3 minutes).

### 4. Output

The scraper creates a CSV file:
```
instagram_jewellery_2025-11-02T19-45-00.csv
```

## 📋 How It Works

1. **Launch:** Puppeteer opens Chrome browser
2. **Load Session:** Tries to load saved cookies (if exists)
3. **Manual Login:** YOU log in (safer, no detection!)
4. **Save Session:** Cookies saved for next run
5. **Navigate:** Goes to Instagram search URL
6. **Scroll:** Loads posts by scrolling
7. **Extract:** Gets post/reel URLs with engagement
8. **Sort:** Orders by engagement, prioritizes reels
9. **CSV:** Saves to CSV file

## 🔧 Features

- ✅ **Manual Login:** You log in yourself (safer!)
- ✅ **Session Persistence:** Saves cookies for next run
- ✅ **Stealth Mode:** Anti-detection with puppeteer-extra
- ✅ **Reel Prioritization:** 60% reels, 40% images
- ✅ **Engagement Sorting:** Orders by likes/views
- ✅ **URL-Only Extraction:** Fast scraping
- ✅ **Manual Data Entry:** You fill in captions/likes
- ✅ **Error Handling:** Graceful failures
- ✅ **Progress Updates:** Shows what's happening

## ⚠️ Important Notes

1. **HEADLESS: false is REQUIRED** - Can't manually log in if browser is hidden
2. **Don't run too frequently** - Wait 30+ minutes between scrapes
3. **Session file persists** - Delete `instagram-session.json` if issues
4. **Use VPN** - Recommended for safety
5. **First run slower** - Takes ~3 minutes for manual login
6. **Next runs faster** - Automatic with saved session
7. **No credentials in code** - All manual, no `.env.local` needed

## 🐛 Troubleshooting

### "Login timeout reached"

- You didn't log in within 3 minutes
- Make sure browser window is visible
- Try again, but log in faster
- Check if Instagram is down

### "No posts found!"

Possible reasons:
- Keyword has no results on Instagram
- Search page structure changed
- Try a different keyword
- Make sure you're logged in

**Solutions:**
1. Check if keyword has results in Instagram app/web
2. Try simpler keywords (e.g., "fitness" instead of "workout tips")
3. Make sure you completed login successfully
4. Delete `instagram-session.json` and retry

### Session not working

- Delete `instagram-session.json` file
- Run scraper again
- Log in manually
- Session will be saved

### Browser won't open

- Make sure `HEADLESS: false` in CONFIG
- Check if port 9222 is in use
- Kill any existing Chrome processes
- Try again

### "Something went wrong" on Instagram

Instagram detected automation:
- Wait at least 24 hours
- Use VPN
- Delete session file
- Try from different network

## 📊 CSV Output Format

```csv
URL
https://www.instagram.com/reel/ABC123/
https://www.instagram.com/p/XYZ789/
https://www.instagram.com/reel/DEF456/
```

**URLs sorted by engagement** (likes/views)

You fill in likes, comments, and captions manually.

## ⚙️ Configuration

Edit `CONFIG` in `instagram-manual-login-scraper.js`:

```javascript
const CONFIG = {
  TOTAL_POSTS: 15,           // Default posts
  REELS_RATIO: 0.6,          // 60% reels
  SCROLL_COUNT: 5,           // Scrolls to load posts
  PAGE_TIMEOUT: 60000,       // 60s timeout
  HEADLESS: false,           // NEVER change this!
  LOGIN_TIMEOUT: 180000,     // 3 minutes to log in
};
```

## 🎯 Next Steps

After you get the CSV:

1. Open CSV in Excel/Google Sheets
2. Visit each URL manually
3. Fill in likes, comments, captions
4. Save and upload to Supabase
5. Update trending tables
6. Display in dashboard

## 💡 Pro Tips

- **Use Chrome** (not required, but best)
- **Close other tabs** before running
- **Wait between runs** (30+ minutes)
- **Save session** (delete only if issues)
- **Use VPN** for safety
- **Test keywords** in Instagram first

## 🚨 Production Use

Before running for real clients:

1. ✅ Test with different keywords
2. ✅ Verify CSV output format
3. ✅ Confirm session persistence works
4. ✅ Don't change `HEADLESS: false`
5. ✅ Monitor for Instagram changes
6. ✅ Have backup keywords ready

## 📌 Testing Checklist

- [ ] Scraper runs without errors
- [ ] Browser opens (`HEADLESS: false`)
- [ ] Manual login works
- [ ] Session file created
- [ ] CSV output generated
- [ ] URLs are valid Instagram links
- [ ] Second run uses saved session
- [ ] Can handle different keywords

## 🔐 Why Manual Login?

**Traditional scraping:** Auto-login with credentials → High detection risk

**Manual login:** You log in yourself → Lower detection risk

**Benefits:**
- Instagram doesn't see bot-like login patterns
- You can complete 2FA yourself
- Less likely to be blocked
- Session persists across runs
- Simpler code (no credential management)

**Trade-off:** Takes ~3 minutes first time, then automatic
