import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

// TODO: For production, integrate with Python microservice or use edge functions
// This is a placeholder that calculates engagement score based on formula

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface PredictionRequest {
  post_url: string;
  post_type: "reel" | "video" | "image" | "carousel";
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  caption?: string;
  theme?: string;
  tone?: string;
  format?: string;
  cta_present?: boolean;
  paid?: boolean; // Whether the post is boosted/paid
  dominant_color?: string;
  music_type?: string;
  posting_time?: string;
  language?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PredictionRequest = await req.json();

    // Validate required fields
    if (!body.post_url || !body.post_type) {
      return NextResponse.json(
        { error: "Missing required fields: post_url, post_type" },
        { status: 400 }
      );
    }

    // For MVP, return a placeholder prediction
    // In production, this would:
    // 1. Generate embedding for caption using OpenAI
    // 2. Load the trained model
    // 3. Prepare feature vector
    // 4. Make prediction
    // 5. Return score

    // Generate embedding if caption exists
    let embedding: number[] | null = null;
    if (body.caption && OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: body.caption.substring(0, 8000),
        });
        embedding = response.data[0].embedding;
      } catch (error) {
        console.error("Error generating embedding:", error);
      }
    }

    // Calculate raw engagement score based on formula
    let rawScore: number;
    if (body.post_type === "reel" || body.post_type === "video") {
      const views = body.views_count || 1;
      rawScore =
        ((body.likes_count || 0) + 3 * (body.comments_count || 0)) / views;
      rawScore = Math.min(rawScore * 100, 100); // Cap at 100
    } else {
      rawScore =
        (body.likes_count || 0) + 3 * (body.comments_count || 0);
      // Normalization would be done during training
      // For now, use a simple heuristic
      rawScore = Math.min((rawScore / 10000) * 100, 100);
    }

    // TODO: Load actual trained model and make real prediction
    // For now, return a mock prediction based on formula
    const predictedScore = Math.max(0, Math.min(100, rawScore));

    return NextResponse.json({
      predicted_engagement_score: Math.round(predictedScore * 100) / 100,
      confidence: "medium", // Would come from model
      features_used: {
        has_embedding: embedding !== null,
        has_labels: !!(
          body.theme || body.tone || body.format || body.cta_present
        ),
      },
      note: "This is a placeholder prediction. Train the model to enable ML-based predictions.",
    });
  } catch (error) {
    console.error("Error in predict-engagement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
