#!/usr/bin/env python3
"""
Train engagement prediction model.
Supports comma-separated values for theme, tone, and color.
Run this weekly after adding new labeled data.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import xgboost as xgb
import joblib
from datetime import datetime

load_dotenv()

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Supabase credentials not found")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def normalize_engagement_scores(df):
    """Normalize engagement scores for images/carousels (0-100 scale)."""
    # Videos/reels already normalized (0-100)
    # Images/carousels need normalization
    
    image_mask = df['post_type'].isin(['image', 'carousel'])
    if not image_mask.any():
        return df
    
    raw_scores = df.loc[image_mask, 'engagement_score']
    
    if raw_scores.empty or raw_scores.isna().all():
        return df
    
    min_score = raw_scores.min()
    max_score = raw_scores.max()
    
    if max_score > min_score:
        normalized = ((raw_scores - min_score) / (max_score - min_score)) * 100
        df.loc[image_mask, 'engagement_score'] = normalized
        print(f"   📊 Image normalization: min={min_score:.2f}, max={max_score:.2f}")
    
    return df

def split_comma_separated(value):
    """Split comma-separated string into list of values."""
    if not value or pd.isna(value):
        return []
    if isinstance(value, str):
        return [v.strip() for v in value.split(',') if v.strip()]
    return []

def prepare_features(df):
    """Prepare feature matrix from training data."""
    features = []
    
    # Collect all unique values for theme, tone, and color
    all_themes = set()
    all_tones = set()
    all_colors = set()
    
    for _, row in df.iterrows():
        themes = split_comma_separated(row.get('theme'))
        tones = split_comma_separated(row.get('tone'))
        colors = split_comma_separated(row.get('dominant_color'))
        
        all_themes.update(themes)
        all_tones.update(tones)
        all_colors.update(colors)
    
    # Convert to sorted lists for consistent ordering
    all_themes = sorted(list(all_themes))
    all_tones = sorted(list(all_tones))
    all_colors = sorted(list(all_colors))
    
    print(f"   📋 Found {len(all_themes)} unique themes: {all_themes[:10]}...")
    print(f"   📋 Found {len(all_tones)} unique tones: {all_tones[:10]}...")
    print(f"   📋 Found {len(all_colors)} unique colors: {all_colors[:10]}...")
    
    for _, row in df.iterrows():
        feature_vector = []
        
        # 1. Caption embedding (1536 dimensions for text-embedding-3-small)
        embedding = row.get('caption_embedding')
        if embedding:
            if isinstance(embedding, str):
                embedding = json.loads(embedding)
            feature_vector.extend(embedding)
        else:
            feature_vector.extend([0.0] * 1536)
        
        # 2. Numerical features
        feature_vector.append(float(row.get('likes_count', 0)))
        feature_vector.append(float(row.get('comments_count', 0)))
        feature_vector.append(float(row.get('views_count', 0) or 0))
        feature_vector.append(float(row.get('followers_count', 0) or 0))  # Account followers count
        
        # 3. Post type (one-hot encoded)
        post_type = row.get('post_type', 'image')
        post_types = ['reel', 'video', 'image', 'carousel']
        for pt in post_types:
            feature_vector.append(1.0 if post_type == pt else 0.0)
        
        # 4. Theme (multi-hot encoding for comma-separated values)
        themes = split_comma_separated(row.get('theme'))
        for theme in all_themes:
            feature_vector.append(1.0 if theme in themes else 0.0)
        
        # 5. Tone (multi-hot encoding for comma-separated values)
        tones = split_comma_separated(row.get('tone'))
        for tone in all_tones:
            feature_vector.append(1.0 if tone in tones else 0.0)
        
        # 6. Color (multi-hot encoding for comma-separated values)
        colors = split_comma_separated(row.get('dominant_color'))
        for color in all_colors:
            feature_vector.append(1.0 if color in colors else 0.0)
        
        # 7. Boolean features
        feature_vector.append(1.0 if row.get('cta_present', False) else 0.0)
        feature_vector.append(1.0 if row.get('paid', False) else 0.0)
        
        # 8. Posting hour (if available)
        posting_time = row.get('posting_time')
        if posting_time:
            try:
                hour = int(str(posting_time).split(':')[0])
                feature_vector.append(hour / 24.0)
            except:
                feature_vector.append(0.5)
        else:
            feature_vector.append(0.5)
        
        # 9. Language (one-hot)
        language = row.get('language', 'English')
        languages = ['English', 'Hindi', 'Bengali', 'Hinglish', 'Other']
        for lang in languages:
            feature_vector.append(1.0 if language == lang else 0.0)
        
        features.append(feature_vector)
    
    return np.array(features), all_themes, all_tones, all_colors

def train_model():
    """Train the engagement prediction model."""
    print("🔍 Fetching labeled training data...")
    
    response = supabase.table("engagement_training_data") \
        .select("*") \
        .eq("is_labeled", True) \
        .not_.is_("caption_embedding", "null") \
        .execute()
    
    if not response.data or len(response.data) == 0:
        print("❌ No labeled data with embeddings found!")
        print("   Please:")
        print("   1. Import posts and label them")
        print("   2. Run generate_embeddings.py")
        sys.exit(1)
    
    df = pd.DataFrame(response.data)
    print(f"   ✅ Found {len(df)} labeled posts with embeddings")
    
    # Normalize engagement scores
    df = normalize_engagement_scores(df)
    
    # Prepare features
    print("🔧 Preparing features...")
    X, all_themes, all_tones, all_colors = prepare_features(df)
    y = df['engagement_score'].values
    
    # Remove NaN values
    valid_mask = ~(np.isnan(y) | np.isnan(X).any(axis=1))
    X = X[valid_mask]
    y = y[valid_mask]
    
    if len(X) == 0:
        print("❌ No valid data after cleaning!")
        sys.exit(1)
    
    print(f"   ✅ Feature matrix shape: {X.shape}")
    print(f"   ✅ Target vector shape: {y.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print("🎯 Training XGBoost model...")
    
    # Train model
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)
    
    print(f"\n{'='*60}")
    print(f"📊 Model Performance:")
    print(f"   Training MAE: {train_mae:.2f}")
    print(f"   Test MAE: {test_mae:.2f}")
    print(f"   Training R²: {train_r2:.4f}")
    print(f"   Test R²: {test_r2:.4f}")
    print(f"{'='*60}")
    
    # Save model
    os.makedirs("models", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    model_path = f"models/engagement_model_{timestamp}.pkl"
    latest_path = "models/engagement_model_latest.pkl"
    
    joblib.dump(model, model_path)
    joblib.dump(model, latest_path)
    
    # Save metadata
    metadata = {
        "timestamp": timestamp,
        "train_mae": float(train_mae),
        "test_mae": float(test_mae),
        "train_r2": float(train_r2),
        "test_r2": float(test_r2),
        "n_samples": int(len(X)),
        "n_features": int(X.shape[1]),
        "themes": all_themes,
        "tones": all_tones,
        "colors": all_colors,
    }
    
    with open(f"models/model_metadata_{timestamp}.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    with open("models/model_metadata_latest.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✅ Model saved:")
    print(f"   {model_path}")
    print(f"   {latest_path}")
    print(f"   Metadata: models/model_metadata_latest.json")

if __name__ == "__main__":
    print("╔══════════════════════════════════════════════════════╗")
    print("║  Engagement Prediction Model Training               ║")
    print("║  Supports comma-separated theme/tone/color values   ║")
    print("╚══════════════════════════════════════════════════════╝\n")
    
    train_model()

