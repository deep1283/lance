# Engagement Prediction ML Pipeline

This directory contains the machine learning pipeline for predicting Instagram post engagement scores (0-100).

## Overview

The pipeline uses:
- **OpenAI Embeddings** (`text-embedding-3-small`) for caption embeddings
- **XGBoost** for regression (predicting engagement scores)
- **scikit-learn** for preprocessing and evaluation

## Workflow

### 1. Data Collection & Import

#### Scrape Instagram Posts
```bash
# Run the scraper
node instagram-scraper-v5.2.js jewellery 20

# Or the simpler scraper (URLs only)
node instagram-manual-login-scraper.js jewellery 20
```

#### Import Scraped Data
```bash
cd ml
python import_scraped_data.py ../instagram_jewellery_2025-11-03.csv [competitor_id] [user_id]
```

This imports:
- Post URLs
- Engagement metrics (likes, comments, views)
- Captions
- Post types

### 2. Manual Labeling

Label posts in Supabase `engagement_training_data` table:

**Required Labels:**
- `theme`: Any text (e.g., "Bridal", "Minimal", "Casual", "Festival", "Luxury", "Traditional", "Contemporary")
- `tone`: Any text (e.g., "Luxury", "Affordable", "Traditional", "Modern", "Playful", "Professional")
- `format`: Reel, Story, Static Image, Carousel, Video
- `cta_present`: true/false (call-to-action in caption)
- `paid`: true/false (whether post is boosted/paid - **important for accurate predictions**)
- `dominant_color`: e.g., "Gold", "Pink"
- `music_type`: e.g., "Bollywood", "Instrumental", "Voiceover"
- `posting_time`: Time when post was published (optional)
- `language`: English, Hindi, Other

**Mark as labeled:**
```sql
UPDATE engagement_training_data 
SET is_labeled = true, labeled_at = NOW(), labeled_by = 'your_user_id'
WHERE id = 'post_id';
```

### 3. Generate Embeddings

```bash
cd ml
python generate_embeddings.py
```

This script:
- Fetches posts with captions but no embeddings
- Generates OpenAI embeddings for each caption
- Saves embeddings to database (JSONB format)

**Cost:** ~$0.00002 per caption (text-embedding-3-small)

### 4. Train Model

```bash
cd ml
python train_model.py
```

This script:
- Fetches all labeled posts with embeddings
- Normalizes engagement scores for images (0-100)
- Prepares feature vectors (embeddings + labels)
- Trains XGBoost model
- Evaluates on test set
- Saves model to `ml/models/`

**Output:**
- `engagement_model_latest.pkl` - Latest trained model
- `scaler_latest.pkl` - Feature scaler
- `metadata_*.json` - Training metrics

### 5. Make Predictions

#### Via API (Placeholder - TODO)
```bash
POST /api/predict-engagement
{
  "post_url": "...",
  "post_type": "reel",
  "likes_count": 1000,
  "comments_count": 50,
  "views_count": 10000,
  "caption": "...",
  "theme": "Luxury",
  ...
}
```

**Note:** Currently returns formula-based prediction. Integration with trained model pending.

## Engagement Score Formulas

### For Videos/Reels (with views):
```
Score = (Likes + 3×Comments) / Views × 100
```

### For Images/Carousels (no views):
```
Raw Score = Likes + 3×Comments
Normalized Score = 100 × (Raw Score - Min) / (Max - Min)
```

Where Min/Max are calculated from training data during model training.

## File Structure

```
ml/
├── requirements.txt          # Python dependencies
├── generate_embeddings.py    # Generate OpenAI embeddings
├── train_model.py           # Train XGBoost model
├── import_scraped_data.py   # Import CSV to Supabase
├── models/                  # Saved models (gitignored)
│   ├── engagement_model_latest.pkl
│   ├── scaler_latest.pkl
│   └── metadata_*.json
└── README.md               # This file
```

## Setup

### 1. Install Python Dependencies

```bash
cd ml
pip install -r requirements.txt
```

### 2. Environment Variables

Add to `.env.local`:
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Run SQL Migration

Execute `create_engagement_training_table.sql` in Supabase SQL Editor.

## Weekly Retraining Workflow

1. **Monday:** Scrape new posts (20-50 posts)
2. **Monday:** Import scraped data
3. **Tuesday-Wednesday:** Manual labeling
4. **Thursday:** Generate embeddings
5. **Friday:** Train model
6. **Weekend:** Deploy new model (if metrics improved)

## Feature Engineering

The model uses:

1. **Caption Embedding** (1536 dims) - OpenAI text-embedding-3-small
2. **Engagement Metrics** (3 dims) - likes, comments, views
3. **Post Type** (4 dims) - one-hot: reel, video, image, carousel
4. **Theme** (8 dims) - one-hot
5. **Tone** (7 dims) - one-hot
6. **Format** (5 dims) - one-hot
7. **CTA Present** (1 dim) - boolean
8. **Paid/Boosted** (1 dim) - boolean (indicates if post is paid/boosted)
9. **Posting Hour** (1 dim) - normalized 0-1
10. **Language** (3 dims) - one-hot

**Total:** ~1570 features

## Model Performance

Target metrics:
- **MAE (Mean Absolute Error):** < 5 points (on 0-100 scale)
- **R² Score:** > 0.7

## Next Steps

- [ ] Integrate trained model into API endpoint
- [ ] Create Python microservice for predictions
- [ ] Add model versioning
- [ ] Create dashboard for model metrics
- [ ] Automated retraining pipeline
- [ ] A/B testing for model versions

## Troubleshooting

**Error: "Not enough training data"**
- Need at least 10 labeled posts
- Label more posts in Supabase

**Error: "OPENAI_API_KEY not found"**
- Add to `.env.local`
- Restart dev server

**Model performance poor:**
- Add more training data
- Improve label quality
- Check for data leakage
- Tune hyperparameters

