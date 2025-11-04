# Next Steps - Engagement Prediction Training

## ✅ Completed
- [x] Table created in Supabase (`engagement_training_data`)
- [x] Python dependencies installed
- [x] Import script updated (removed competitor_id, added date parsing)

## 📋 Training Workflow (1+ Months)

### Step 1: Collect Instagram Posts (Apify + Manual)

**Option A: Using Apify**
1. Use Apify Instagram scraper to collect posts
2. Export data to CSV format (see `CSV_FORMAT_GUIDE.md` for exact format)
3. Save CSV file (e.g., `training_data_2025-01-15.csv`)

**Option B: Manual Collection**
1. Manually collect post URLs and engagement data
2. Create CSV file using the template (`training_data_template.csv`)
3. Fill in columns: URL, Type, Likes, Comments, Views, Caption, Language, Posted Date

**CSV Format:**
- **Required:** `URL` column (must have Instagram post URLs)
- **Optional:** Type, Likes, Comments, Views, Caption, Language, Posted Date
- See `CSV_FORMAT_GUIDE.md` for complete format details and Apify mapping examples

**Template:** Use `training_data_template.csv` as a starting point

### Step 2: Import Training Data

```bash
cd ml
source venv/bin/activate  # Activate virtual environment

# Import CSV (provide path to your CSV file)
python import_scraped_data.py /path/to/your/training_data.csv

# Or if CSV is in the lance directory:
python import_scraped_data.py ../training_data_2025-01-15.csv

# Optional: with user_id for tracking
python import_scraped_data.py ../training_data_2025-01-15.csv <your-user-uuid>
```

**What this does:**
- Imports post URLs, engagement metrics, captions
- Detects post type (reel/video/image/carousel)
- Parses and stores posted date (DATE format)
- Skips duplicates automatically
- Calculates engagement_score automatically (via trigger)

### Step 3: Label Posts in Supabase

Go to Supabase Dashboard → Table Editor → `engagement_training_data`

**For each post, label these fields:**
- `theme`: Any text (e.g., "Bridal", "Minimal", "Luxury", "Festival")
- `tone`: Any text (e.g., "Luxury", "Affordable", "Modern", "Playful")
- `format`: Reel, Story, Static Image, Carousel, or Video
- `cta_present`: true/false (call-to-action in caption?)
- `paid`: **true/false** (whether post is boosted/paid - **important for model accuracy!**)
- `dominant_color`: e.g., "Gold", "Pink", "Blue"
- `music_type`: e.g., "Bollywood", "Instrumental", "Voiceover" (for reels/videos)
- `language`: English, Hindi, or Other
- `is_labeled`: Set to `true` when done
- `labeled_by`: Your user_id

**Goal:** Label at least 50-100 posts for initial training (aim for 200+ for better accuracy)

### Step 4: Generate Embeddings

```bash
cd ml
source venv/bin/activate

# Generate OpenAI embeddings for all captions
python generate_embeddings.py
```

**What this does:**
- Fetches posts with captions but no embeddings
- Generates OpenAI embeddings (text-embedding-3-small)
- Saves embeddings to `caption_embedding` column (JSONB)
- Cost: ~$0.00002 per caption

### Step 5: Train Model

```bash
cd ml
source venv/bin/activate

# Train XGBoost model
python train_model.py
```

**What this does:**
- Fetches all labeled posts with embeddings
- Normalizes engagement scores for images (0-100 scale)
- Prepares feature vectors (embeddings + labels)
- Trains XGBoost regression model
- Evaluates on test set (80/20 split)
- Saves model to `ml/models/engagement_model_latest.pkl`

**Output:**
- Training metrics (MAE, R²)
- Model saved in `ml/models/`
- Scaler saved in `ml/models/scaler_latest.pkl`

### Step 6: Test Predictions (Don't Show to Users Yet!)

Use the trained model to make predictions on new posts:

1. Import new scraped posts (not yet labeled)
2. Generate embeddings for new posts
3. Make predictions using the model
4. Store predictions in `predicted_score` column
5. Compare `predicted_score` vs `engagement_score` (when you label them later)

**Goal:** Collect at least 1 month of predictions and compare accuracy before showing to users.

### Step 7: Validate & Approve

After 1+ months:
- Review prediction accuracy (`prediction_accuracy` column)
- Check if MAE < 5 points (on 0-100 scale)
- Check if R² > 0.7
- Once satisfied, integrate predictions into dashboard API

## 📊 Monitoring Progress

### Check Labeling Progress
```sql
SELECT 
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE is_labeled = true) as labeled_posts,
  COUNT(*) FILTER (WHERE caption_embedding IS NOT NULL) as posts_with_embeddings,
  COUNT(*) FILTER (WHERE has_prediction = true) as posts_with_predictions
FROM engagement_training_data;
```

### Check Model Accuracy
```sql
SELECT 
  AVG(ABS(predicted_score - engagement_score)) as avg_error,
  COUNT(*) as prediction_count
FROM engagement_training_data
WHERE has_prediction = true AND is_labeled = true;
```

## ⚠️ Important Reminders

1. **DO NOT** show predictions on dashboard during testing phase
2. **DO** label posts consistently (same theme/tone values for similar content)
3. **DO** collect diverse data (different niches, formats, themes)
4. **DO** retrain model weekly as you add more labeled data
5. **DO** track prediction accuracy over time

## 🔄 Weekly Routine

- **Monday:** Scrape 20-50 new posts
- **Monday:** Import scraped data
- **Tuesday-Wednesday:** Label new posts
- **Thursday:** Generate embeddings for new posts
- **Friday:** Retrain model and evaluate
- **Weekend:** Test predictions on unlabeled posts

## 📁 File Locations

- **Scraped CSV:** `/lance/instagram_*.csv`
- **Python Scripts:** `/lance/ml/*.py`
- **Trained Models:** `/lance/ml/models/*.pkl` (gitignored)
- **Environment:** `/lance/ml/venv/` (gitignored)

## 🆘 Troubleshooting

**Error: "Not enough training data"**
- Need at least 10 labeled posts with embeddings
- Label more posts in Supabase

**Error: "OPENAI_API_KEY not found"**
- Add `OPENAI_API_KEY` to `.env.local` in `/lance/`
- Restart terminal/IDE

**Poor model performance:**
- Need more labeled data (aim for 200+ posts)
- Check label consistency
- Ensure diverse dataset (not just one niche/theme)
