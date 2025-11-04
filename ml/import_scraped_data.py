#!/usr/bin/env python3
"""
Import scraped Instagram data into engagement_training_data table.
Reads CSV files from scraper and inserts into Supabase.
"""

import os
import sys
import csv
import json
from dotenv import load_dotenv  # Requires: pip install python-dotenv
from supabase import create_client, Client
from datetime import datetime

load_dotenv()

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Supabase credentials not found")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def detect_post_type(url: str) -> str:
    """Detect post type from URL."""
    if "/reel/" in url or "/tv/" in url:
        return "reel"
    elif "/p/" in url:
        return "image"  # Default, can be updated later
    return "image"

def parse_date(date_str: str) -> str:
    """Parse date string to DATE format (YYYY-MM-DD)."""
    if not date_str or not date_str.strip():
        return None
    
    date_str = date_str.strip()
    
    # Try common date formats
    date_formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
    ]
    
    for fmt in date_formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")  # Return DATE format
        except ValueError:
            continue
    
    # If all formats fail, try to extract just the date part
    try:
        # Try ISO format without timezone
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime("%Y-%m-%d")
    except:
        pass
    
    print(f"   ⚠️  Warning: Could not parse date '{date_str}', skipping date")
    return None

def import_csv(csv_path: str, user_id: str = None):
    """Import CSV data into training table."""
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        return
    
    print(f"📂 Reading CSV: {csv_path}")
    
    imported = 0
    skipped = 0
    errors = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            post_url = row.get('URL', '').strip()
            
            if not post_url:
                skipped += 1
                continue
            
            # Check if already exists
            existing = supabase.table("engagement_training_data") \
                .select("id") \
                .eq("post_url", post_url) \
                .execute()
            
            if existing.data:
                skipped += 1
                print(f"   ⏭️  Skipped (exists): {post_url[:50]}")
                continue
            
            # Extract post type from CSV if available
            post_type = row.get('Type', '').lower() or detect_post_type(post_url)
            
            # Parse posted date (look for common CSV column names)
            posted_date = None
            for date_col in ['Posted Date', 'Date', 'Posted_Date', 'posted_at', 'Post Date']:
                if date_col in row and row[date_col]:
                    posted_date = parse_date(row[date_col])
                    break
            
            # Prepare data
            data = {
                "post_url": post_url,
                "post_type": post_type,
                "likes_count": int(row.get('Likes', 0) or 0),
                "comments_count": int(row.get('Comments', 0) or 0),
                "views_count": int(row.get('Views', 0) or 0),
                "caption": row.get('Caption', '').strip() or None,
                "language": row.get('Language', 'English') or 'English',
            }
            
            # Add posted_at if available
            if posted_date:
                data["posted_at"] = posted_date
            
            # Add user_id if provided
            if user_id:
                data["user_id"] = user_id
            
            try:
                supabase.table("engagement_training_data").insert(data).execute()
                imported += 1
                print(f"   ✅ Imported: {post_url[:50]}")
            except Exception as e:
                errors += 1
                print(f"   ❌ Error: {post_url[:50]} - {str(e)[:50]}")
    
    print(f"\n{'='*60}")
    print(f"✅ Import complete!")
    print(f"   Imported: {imported}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}")
    print(f"{'='*60}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_scraped_data.py <csv_file> [user_id]")
        print("\nExample:")
        print("  python import_scraped_data.py ../instagram_jewellery_2025-11-03.csv")
        print("  python import_scraped_data.py ../instagram_jewellery_2025-11-03.csv <user_uuid>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    user_id = sys.argv[2] if len(sys.argv) > 2 else None
    
    print("╔══════════════════════════════════════════════════════╗")
    print("║  Scraped Data Importer for Training                 ║")
    print("╚══════════════════════════════════════════════════════╝\n")
    
    import_csv(csv_path, user_id)
