# LanceIQ Setup Guide

## 1. Supabase Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get your project URL and anon key

### Add Environment Variables

Create `.env.local` in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Run Database Setup

1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `supabase-setup.sql`
3. Run the contents of `dashboard-schema.sql`

## 2. Add Test Data

### Method 1: Using the Script (Recommended)

```bash
# Install dependencies if needed
npm install @supabase/supabase-js

# Run the test data script
node add-test-data.js
```

### Method 2: Manual Setup

1. **Get your User ID:**

   - Go to Supabase Dashboard → Authentication → Users
   - Find your user and copy the UUID

2. **Add Competitors:**

   ```sql
   INSERT INTO competitors (name, industry, status) VALUES
   ('Nike', 'Sports & Fitness', 'active'),
   ('Adidas', 'Sports & Fitness', 'active'),
   ('Apple', 'Technology', 'active'),
   ('Samsung', 'Technology', 'active');
   ```

3. **Link Competitors to Your Account:**

   ```sql
   -- Replace 'YOUR_USER_ID_HERE' with your actual user ID
   INSERT INTO user_competitors (user_id, competitor_id)
   SELECT 'YOUR_USER_ID_HERE', id FROM competitors;
   ```

4. **Add Sample Ads:**

   ```sql
   INSERT INTO competitor_ads (competitor_id, platform, ad_text, creative_url, landing_page_url, start_date, end_date, gpt_analysis) VALUES
   ((SELECT id FROM competitors WHERE name = 'Nike'), 'Meta', 'New Nike Collection - Limited Time Offer', 'https://example.com/nike1.jpg', 'https://nike.com/new', '2024-01-01', '2024-01-31', 'Strong urgency messaging with limited time offer.'),
   ((SELECT id FROM competitors WHERE name = 'Adidas'), 'Google', 'Adidas - Best Quality Products', 'https://example.com/adidas1.jpg', 'https://adidas.com/quality', '2024-01-15', '2024-02-15', 'Quality-focused messaging building brand trust.');
   ```

5. **Add Sample Creatives:**
   ```sql
   INSERT INTO competitor_creatives (competitor_id, platform, creative_url, caption, post_date, likes, comments, shares, gpt_analysis) VALUES
   ((SELECT id FROM competitors WHERE name = 'Nike'), 'Instagram', 'https://example.com/nike_insta.jpg', 'Just launched! Check out our new Nike collection 🔥 #fashion #style', '2024-01-20', 1250, 89, 34, 'High engagement with trending hashtags and social proof.'),
   ((SELECT id FROM competitors WHERE name = 'Adidas'), 'TikTok', 'https://example.com/adidas_tiktok.mp4', 'POV: You discover the perfect sneakers 💫', '2024-01-18', 3200, 156, 78, 'Trending POV format with viral potential.');
   ```

## 3. Testing with Multiple Accounts

### Add Another User Account

1. **Create second account:**

   - Use different email/phone in your app
   - Complete signup process
   - Get the new user ID from Supabase

2. **Assign different competitors:**

   ```sql
   -- Give the new user different competitors
   INSERT INTO user_competitors (user_id, competitor_id)
   SELECT 'NEW_USER_ID_HERE', id FROM competitors
   WHERE name IN ('Apple', 'Samsung');
   ```

3. **Add user-specific data:**
   ```sql
   -- Add website analysis for the new user
   INSERT INTO analyzed_websites (user_id, url, speed_score, seo_score, keywords, gpt_analysis) VALUES
   ('NEW_USER_ID_HERE', 'https://mywebsite.com', 85, 92, ARRAY['technology', 'innovation'], 'Great performance with strong SEO optimization.');
   ```

## 4. Dashboard Features

### What You'll See

- **Competitor Cards**: Shows assigned competitors with stats
- **Analytics Charts**:
  - Competitor Activity (bar chart)
  - Platform Distribution (pie chart)
  - Ad Trend Over Time (line chart)
- **Competitor Details**: Click any competitor to see detailed analysis
- **Website Analysis**: Analyze your own website performance

### Adding More Data

- **Ads**: Add more competitor ads in `competitor_ads` table
- **Creatives**: Add social media posts in `competitor_creatives` table
- **Websites**: Add website analysis in `competitor_websites` table

## 5. Production Setup

### Enable RLS Policies

All tables have Row Level Security enabled, so users only see their own data.

### Admin Functions

For production, create admin functions to:

- Bulk upload competitor data
- Manage user-competitor relationships
- Generate reports

### API Keys

- Keep service role key secure
- Use anon key for client-side operations
- Consider creating custom API endpoints for bulk operations

## Troubleshooting

### Common Issues

1. **"Users table not found"**: Run `supabase-setup.sql` first
2. **"No competitors"**: Check user_competitors table has your user ID
3. **Charts empty**: Ensure competitor_ads and competitor_creatives have data
4. **Permission denied**: Check RLS policies are correct

### Debug Commands

```sql
-- Check if user exists
SELECT * FROM users WHERE id = 'YOUR_USER_ID';

-- Check user's competitors
SELECT c.* FROM competitors c
JOIN user_competitors uc ON c.id = uc.competitor_id
WHERE uc.user_id = 'YOUR_USER_ID';

-- Check ads data
SELECT * FROM competitor_ads ca
JOIN user_competitors uc ON ca.competitor_id = uc.competitor_id
WHERE uc.user_id = 'YOUR_USER_ID';
```
