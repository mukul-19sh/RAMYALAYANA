import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit } = await request.json();

    if (!code || !discountType || !discountValue || !expiryDate) {
      return NextResponse.json({ error: "Missing required coupon fields" }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscount,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit || 100,
      isActive: true,
    });

    return NextResponse.json({ message: "Coupon created successfully", coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create coupon" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { couponId, isActive, usageLimit, expiryDate } = await request.json();

    if (!couponId || !/^[0-9a-fA-F]{24}$/.test(couponId)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const updates: any = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (usageLimit !== undefined) updates.usageLimit = usageLimit;
    if (expiryDate !== undefined) updates.expiryDate = new Date(expiryDate);

    const coupon = await Coupon.findByIdAndUpdate(couponId, updates, { new: true });
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Coupon updated successfully", coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update coupon" }, { status: 500 });
  }
}
