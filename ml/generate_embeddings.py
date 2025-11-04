#!/usr/bin/env python3
"""
Generate OpenAI embeddings for engagement training data captions.
Run this before training the model.
"""

import os
import sys
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client
import json
import time

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("❌ OPENAI_API_KEY not found in environment variables")
    sys.exit(1)

openai_client = OpenAI(api_key=openai_api_key)

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Supabase credentials not found in environment variables")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def generate_embedding(text: str) -> list:
    """Generate embedding for a text using OpenAI."""
    if not text or len(text.strip()) == 0:
        return None
    
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000]  # Limit to 8000 chars (OpenAI limit)
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"⚠️  Error generating embedding: {e}")
        return None

def update_embeddings():
    """Fetch posts without embeddings and generate them."""
    print("🔍 Fetching posts without embeddings...")
    
    # Fetch posts where caption_embedding is null
    response = supabase.table("engagement_training_data") \
        .select("id, post_url, caption") \
        .is_("caption_embedding", "null") \
        .not_.is_("caption", "null") \
        .execute()
    
    posts = response.data
    total = len(posts)
    
    if total == 0:
        print("✅ No posts need embeddings!")
        return
    
    print(f"📊 Found {total} posts needing embeddings")
    
    updated = 0
    failed = 0
    
    for i, post in enumerate(posts, 1):
        post_id = post["id"]
        caption = post.get("caption", "")
        post_url = post.get("post_url", "")[:50]
        
        print(f"\n[{i}/{total}] Processing: {post_url}...")
        
        embedding = generate_embedding(caption)
        
        if embedding:
            try:
                # Update the post with embedding
                supabase.table("engagement_training_data") \
                    .update({"caption_embedding": json.dumps(embedding)}) \
                    .eq("id", post_id) \
                    .execute()
                
                updated += 1
                print(f"   ✅ Embedding generated and saved")
                
                # Rate limiting: OpenAI allows 3000 requests/min
                time.sleep(0.02)  # ~50 requests/second
                
            except Exception as e:
                print(f"   ❌ Failed to save embedding: {e}")
                failed += 1
        else:
            failed += 1
            print(f"   ⚠️  Skipped (empty caption or error)")
    
    print(f"\n{'='*60}")
    print(f"✅ Complete! Updated: {updated}, Failed: {failed}, Total: {total}")
    print(f"{'='*60}")

if __name__ == "__main__":
    print("╔══════════════════════════════════════════════════════╗")
    print("║  OpenAI Embedding Generator for Engagement Model    ║")
    print("╚══════════════════════════════════════════════════════╝\n")
    
    update_embeddings()

