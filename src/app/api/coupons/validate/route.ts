import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { CouponValidateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const parseResult = CouponValidateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { code } = parseResult.data;
    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 404 });
    }

    // Expiry check
    if (new Date() > new Date(coupon.expiryDate)) {
      return NextResponse.json({ error: "Coupon code has expired" }, { status: 400 });
    }

    // Usage limit check
    if (coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon code usage limit exceeded" }, { status: 400 });
    }

    return NextResponse.json({
      message: "Coupon validated successfully",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to validate coupon" }, { status: 500 });
  }
}
