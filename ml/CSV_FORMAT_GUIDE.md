# CSV Format Guide for Training Data Import

This guide explains the exact CSV format required for importing training data using Apify or manual data collection.

## 📋 Required CSV Columns

### Required Columns (Must Have)

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| **URL** | Text | Full Instagram post URL | `https://www.instagram.com/p/ABC123/` |
| | | | `https://www.instagram.com/reel/XYZ456/` |

### Optional Columns (Recommended)

| Column Name | Type | Description | Example | Default |
|------------|------|-------------|---------|---------|
| **Type** | Text | Post type: `reel`, `video`, `image`, `carousel` | `reel` | Auto-detected from URL |
| **Likes** | Integer | Number of likes | `1250` | `0` |
| **Comments** | Integer | Number of comments | `89` | `0` |
| **Views** | Integer | Number of views (for reels/videos) | `45000` | `0` |
| **Caption** | Text | Post caption text | `"Beautiful collection! ✨"` | `null` |
| **Language** | Text | Language of caption | `English`, `Hindi`, `Other` | `English` |
| **Posted Date** | Date | Date when post was published | `2024-01-15` | `null` |
| | | Alternative column names accepted: | | |
| | | - `Date` | | |
| | | - `Posted_Date` | | |
| | | - `posted_at` | | |
| | | - `Post Date` | | |

## 📝 CSV Example

```csv
URL,Type,Likes,Comments,Views,Caption,Language,Posted Date
https://www.instagram.com/p/ABC123/,image,1250,89,0,"Beautiful gold-plated jewelry collection! ✨ Shop now #jewelry #fashion",English,2024-01-15
https://www.instagram.com/reel/XYZ456/,reel,3200,156,45000,"Check out our new bridal collection! 💍 #bridal #jewelry",English,2024-01-16
https://www.instagram.com/p/DEF789/,carousel,890,45,0,"Festival collection - Traditional meets modern 🎉 #festival",English,2024-01-17
https://www.instagram.com/reel/GHI012/,reel,5670,234,89000,"Minimalist designs that speak volumes ✨ #minimal #luxury",English,2024-01-18
https://www.instagram.com/p/JKL345/,image,450,23,0,"Casual everyday jewelry for the modern woman 💫",English,2024-01-19
```

## 📐 Minimal CSV (Only Required Fields)

If you only have URLs, that's fine too:

```csv
URL
https://www.instagram.com/p/ABC123/
https://www.instagram.com/reel/XYZ456/
https://www.instagram.com/p/DEF789/
```

The import script will:
- Auto-detect post type from URL (`/reel/` → reel, `/p/` → image)
- Set all engagement metrics to 0
- Set language to "English"
- Leave caption and date as null

## 🔧 Apify Output Mapping

If using Apify Instagram scraper, map the columns like this:

| Apify Field | CSV Column | Notes |
|------------|-----------|-------|
| `url` | `URL` | Full Instagram URL |
| `type` | `Type` | Map: `GraphImage` → `image`, `GraphVideo` → `reel` |
| `likesCount` | `Likes` | Number |
| `commentsCount` | `Comments` | Number |
| `viewsCount` | `Views` | For reels/videos |
| `caption` | `Caption` | Full caption text |
| `takenAtTimestamp` | `Posted Date` | Convert timestamp to `YYYY-MM-DD` format |

### Apify Example Mapping (JavaScript)

```javascript
const csvRows = apifyData.map(post => ({
  URL: post.url,
  Type: post.type === 'GraphImage' ? 'image' : 
        post.type === 'GraphVideo' ? 'reel' : 
        post.type === 'GraphSidecar' ? 'carousel' : 'image',
  Likes: post.likesCount || 0,
  Comments: post.commentsCount || 0,
  Views: post.viewsCount || 0,
  Caption: post.caption || '',
  Language: 'English', // Or detect from caption
  'Posted Date': new Date(post.takenAtTimestamp * 1000).toISOString().split('T')[0] // YYYY-MM-DD
}));
```

## 📅 Date Format

Dates must be in **YYYY-MM-DD** format:

✅ **Valid:**
- `2024-01-15`
- `2024-12-31`

❌ **Invalid:**
- `01/15/2024` (will be auto-parsed if possible)
- `15-01-2024` (may fail)
- `2024-1-15` (should be `2024-01-15`)

The import script tries to parse common formats automatically, but `YYYY-MM-DD` is recommended.

## 📊 Post Type Values

Use exactly these values for the `Type` column:

- `reel` - Instagram Reels
- `video` - Video posts
- `image` - Single image posts
- `carousel` - Multiple image/video posts

**Case:** Lowercase preferred, but script converts to lowercase automatically.

## 🌍 Language Values

Use these values for `Language`:

- `English`
- `Hindi`
- `Other`

**Case:** Script is case-insensitive, but capitalize as shown.

## ⚠️ Important Notes

1. **CSV Encoding:** Save as UTF-8 to handle emojis and special characters in captions
2. **Quotes:** If caption contains commas or quotes, wrap in double quotes: `"Caption, with comma!"`
3. **Empty Values:** Leave cells empty for optional fields (don't put `null` or `N/A`)
4. **Duplicates:** The script automatically skips duplicate URLs (based on `post_url` uniqueness)
5. **Headers:** First row must contain column headers (exactly as shown above)

## 📥 Importing

Once you have your CSV file:

```bash
cd ml
source venv/bin/activate
python import_scraped_data.py /path/to/your/training_data.csv
```

## ✅ Validation Checklist

Before importing, verify:

- [ ] CSV has `URL` column (required)
- [ ] All URLs are valid Instagram URLs
- [ ] Dates are in `YYYY-MM-DD` format (if included)
- [ ] Numbers (Likes, Comments, Views) are integers
- [ ] File is saved as UTF-8 encoding
- [ ] Captions with commas/quotes are wrapped in double quotes

## 🔍 Example: Complete CSV with All Fields

```csv
URL,Type,Likes,Comments,Views,Caption,Language,Posted Date
https://www.instagram.com/p/ABC123/,image,1250,89,0,"Beautiful gold-plated jewelry collection! ✨ Shop now #jewelry #fashion",English,2024-01-15
https://www.instagram.com/reel/XYZ456/,reel,3200,156,45000,"Check out our new bridal collection! 💍 #bridal #jewelry",English,2024-01-16
https://www.instagram.com/p/DEF789/,carousel,890,45,0,"Festival collection - Traditional meets modern 🎉 #festival",English,2024-01-17
```

Save this template and fill it with your Apify/manual data!
