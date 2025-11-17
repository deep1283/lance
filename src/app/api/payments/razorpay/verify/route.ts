export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    const valid = expectedSignature === razorpay_signature;
    if (!valid) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json(
        { error: "Failed to verify Razorpay payment" },
        { status: 500 }
    );
  }
}
