#!/usr/bin/env python3
"""
Train engagement prediction model.
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
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import xgboost as xgb
import joblib
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Supabase credentials not found")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def normalize_image_scores(df):
    """Normalize engagement scores for image posts (0-100 scale)."""
    image_df = df[df['post_type'].isin(['image', 'carousel'])].copy()
    
    if len(image_df) == 0:
        return df
    
    raw_scores = image_df['engagement_score'].values
    min_score = raw_scores.min()
    max_score = raw_scores.max()
    
    if max_score > min_score:
        normalized = ((raw_scores - min_score) / (max_score - min_score)) * 100
        df.loc[df['post_type'].isin(['image', 'carousel']), 'engagement_score'] = normalized
        print(f"   📊 Image normalization: min={min_score:.2f}, max={max_score:.2f}")
    
    return df

def prepare_features(df):
    """Prepare feature matrix from training data."""
    features = []
    
    for _, row in df.iterrows():
        feature_vector = []
        
        # 1. Caption embedding (1536 dimensions for text-embedding-3-small)
        embedding = row.get('caption_embedding')
        if embedding:
            if isinstance(embedding, str):
                embedding = json.loads(embedding)
            feature_vector.extend(embedding)
        else:
            # Zero vector if no embedding
            feature_vector.extend([0.0] * 1536)
        
        # 2. Numerical features (normalize)
        feature_vector.append(float(row.get('likes_count', 0)))
        feature_vector.append(float(row.get('comments_count', 0)))
        feature_vector.append(float(row.get('views_count', 0)))
        
        # 3. Post type (one-hot encoded)
        post_type = row.get('post_type', 'image')
        post_types = ['reel', 'video', 'image', 'carousel']
        for pt in post_types:
            feature_vector.append(1.0 if post_type == pt else 0.0)
        
        # 4. Categorical labels (label encoded or one-hot)
        theme = row.get('theme', '')
        themes = ['Bridal', 'Minimal', 'Casual', 'Festival', 'Luxury', 'Traditional', 'Contemporary', 'Other']
        for t in themes:
            feature_vector.append(1.0 if theme == t else 0.0)
        
        tone = row.get('tone', '')
        tones = ['Luxury', 'Affordable', 'Traditional', 'Modern', 'Playful', 'Professional', 'Other']
        for to in tones:
            feature_vector.append(1.0 if tone == to else 0.0)
        
        format_type = row.get('format', '')
        formats = ['Reel', 'Story', 'Static Image', 'Carousel', 'Video']
        for f in formats:
            feature_vector.append(1.0 if format_type == f else 0.0)
        
        # 5. Boolean features
        feature_vector.append(1.0 if row.get('cta_present', False) else 0.0)
        feature_vector.append(1.0 if row.get('paid', False) else 0.0)  # Paid/boosted post indicator
        
        # 6. Posting time features (extract hour and day of week)
        posting_time = row.get('posting_time')
        if posting_time:
            try:
                hour = int(str(posting_time).split(':')[0])
                feature_vector.append(hour / 24.0)  # Normalized hour
            except:
                feature_vector.append(0.5)  # Default to noon
        else:
            feature_vector.append(0.5)
        
        # 7. Language (one-hot)
        language = row.get('language', 'English')
        languages = ['English', 'Hindi', 'Other']
        for lang in languages:
            feature_vector.append(1.0 if language == lang else 0.0)
        
        features.append(feature_vector)
    
    return np.array(features)

def train_model():
    """Train the engagement prediction model."""
    print("🔍 Fetching labeled training data...")
    
    # Fetch all labeled posts
    response = supabase.table("engagement_training_data") \
        .select("*") \
        .eq("is_labeled", True) \
        .not_.is_("caption_embedding", "null") \
        .execute()
    
    data = response.data
    total = len(data)
    
    if total < 10:
        print(f"❌ Not enough training data! Need at least 10 labeled posts, found {total}")
        print("   Please label more posts before training.")
        sys.exit(1)
    
    print(f"📊 Found {total} labeled posts with embeddings")
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Normalize engagement scores for images
    print("\n🔄 Normalizing engagement scores for images...")
    df = normalize_image_scores(df)
    
    # Prepare features and target
    print("\n🔧 Preparing features...")
    X = prepare_features(df)
    y = df['engagement_score'].values.astype(float)
    
    print(f"   Feature shape: {X.shape}")
    print(f"   Target range: {y.min():.2f} - {y.max():.2f}")
    
    # Split data
    print("\n📊 Splitting data (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    print("🔧 Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train XGBoost model
    print("\n🚀 Training XGBoost model...")
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    print("\n📈 Evaluating model...")
    y_train_pred = model.predict(X_train_scaled)
    y_test_pred = model.predict(X_test_scaled)
    
    train_mae = mean_absolute_error(y_train, y_train_pred)
    test_mae = mean_absolute_error(y_test, y_test_pred)
    train_r2 = r2_score(y_train, y_train_pred)
    test_r2 = r2_score(y_test, y_test_pred)
    
    print(f"\n   Training Set:")
    print(f"     MAE: {train_mae:.2f}")
    print(f"     R²: {train_r2:.4f}")
    print(f"\n   Test Set:")
    print(f"     MAE: {test_mae:.2f}")
    print(f"     R²: {test_r2:.4f}")
    
    # Save model and scaler
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(model_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_path = os.path.join(model_dir, f"engagement_model_{timestamp}.pkl")
    scaler_path = os.path.join(model_dir, f"scaler_{timestamp}.pkl")
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    # Also save latest versions
    latest_model_path = os.path.join(model_dir, "engagement_model_latest.pkl")
    latest_scaler_path = os.path.join(model_dir, "scaler_latest.pkl")
    
    joblib.dump(model, latest_model_path)
    joblib.dump(scaler, latest_scaler_path)
    
    print(f"\n✅ Model saved to: {model_path}")
    print(f"✅ Scaler saved to: {scaler_path}")
    print(f"✅ Latest versions saved (for API use)")
    
    # Save metadata
    metadata = {
        "trained_at": timestamp,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "train_mae": float(train_mae),
        "test_mae": float(test_mae),
        "train_r2": float(train_r2),
        "test_r2": float(test_r2),
        "feature_count": X.shape[1]
    }
    
    metadata_path = os.path.join(model_dir, f"metadata_{timestamp}.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n📊 Metadata saved to: {metadata_path}")
    
    return model, scaler, metadata

if __name__ == "__main__":
    print("╔══════════════════════════════════════════════════════╗")
    print("║  Engagement Prediction Model Trainer                 ║")
    print("╚══════════════════════════════════════════════════════╝\n")
    
    train_model()
    
    print("\n✅ Training complete!")

