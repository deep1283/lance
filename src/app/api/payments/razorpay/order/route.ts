export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const currency = body.currency || "INR";
    const receipt = body.receipt || `rcpt_${Date.now()}`;

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount (in paise) is required" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: true,
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
