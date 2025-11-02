# Instagram Manual Login Scraper

## ✅ What's Ready

- ✅ Puppeteer-extra with Stealth Plugin installed
- ✅ Manual login scraper script created (`instagram-manual-login-scraper.js`)
- ✅ **Session Management** (automatic persistence)
- ✅ Reel prioritization (60% reels, 40% images)
- ✅ CSV output format
- ✅ Engagement-based sorting
- ✅ Error handling & reliability

## 🎯 How It Works

**Key Feature:** Manual login (YOU log in yourself) - this is safer and more reliable!

1. Browser opens automatically
2. You log in to Instagram manually
3. Session is saved automatically
4. Scraper navigates to search page
5. Extracts top post URLs
6. Saves to CSV

**No credentials needed** - you just log in when prompted!

## 🚀 Quick Start

### Step 1: Run

```bash
cd lance
node instagram-manual-login-scraper.js jewellery
```

Or specify number of posts:

```bash
node instagram-manual-login-scraper.js jewellery 20
```

### Step 2: Manual Login

When the browser opens:
1. Log in to Instagram with your credentials
2. Complete any 2FA if prompted
3. Click "Not Now" on "Save Login Info" prompt
4. Click "Not Now" on notifications prompt
5. Wait on the Instagram home page

The scraper will automatically detect when you're logged in!

### Step 3: Output

The scraper creates a CSV file:
```
instagram_jewellery_2025-11-02T19-45-00.csv
```

## 📊 What You Get

CSV with column:
- `URL` - Sorted by engagement (likes/views)

**Default: 15 URLs** (60% reels, 40% images)

**Note:** Only URLs are extracted automatically. You fill in likes, comments, and captions manually by visiting each URL.

## ⚠️ Important Notes

1. **Keep HEADLESS: false** - Required for manual login
2. **Don't run too frequently** - Wait 30+ minutes between scrapes
3. **Session persistence** - Next run will skip manual login!
4. **Delete session** - Remove `instagram-session.json` if login issues
5. **Use VPN** - Recommended for safety

## 💡 Tips

- **First run:** Log in manually (~3 minutes max)
- **Next runs:** Automatic (session saved!)
- **Session file:** `instagram-session.json`
- **Wait between runs:** 30+ minutes minimum
- **VPN:** Use for extra safety

## 🔄 Session Management

- **First run:** Manual login required
- **Subsequent runs:** Uses saved session (faster!)
- **Delete session:** Remove `instagram-session.json` file
- **Login issues:** Delete session file and retry

See `SCRAPER_SETUP.md` for detailed troubleshooting.
