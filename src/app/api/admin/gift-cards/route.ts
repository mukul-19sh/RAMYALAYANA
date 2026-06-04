import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import GiftCard from "@/models/GiftCard";
import { auth } from "@/auth";
import crypto from "crypto";

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { initialValue, recipientEmail, senderName, message, customExpiryDays } = await request.json();

    if (!initialValue || initialValue <= 0) {
      return NextResponse.json({ error: "Initial value must be greater than 0" }, { status: 400 });
    }

    // Generate secure plaintext code
    const rawSegments = Array.from({ length: 3 }, () =>
      crypto.randomBytes(2).toString("hex").toUpperCase()
    );
    const plaintextCode = `RAMYA-GC-${rawSegments.join("-")}`;
    const codeHash = sha256(plaintextCode);
    const codeMask = `****-****-${plaintextCode.slice(-4)}`;

    const expiryDays = customExpiryDays || 365;
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const giftCard = await GiftCard.create({
      codeHash,
      codeMask,
      initialValue,
      currentValue: initialValue,
      expiryDate,
      recipientEmail: recipientEmail?.toLowerCase(),
      senderName,
      message,
      isActive: true,
    });

    // Plaintext code is returned only ONCE during creation
    return NextResponse.json({
      message: "Gift card created successfully.",
      plaintextCode,
      giftCard,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create gift card" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { giftCardId, extendedExpiryDays } = await request.json();

    if (!giftCardId || !/^[0-9a-fA-F]{24}$/.test(giftCardId)) {
      return NextResponse.json({ error: "Invalid gift card ID" }, { status: 400 });
    }

    const giftCard = await GiftCard.findById(giftCardId);
    if (!giftCard) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
    }

    const addedDays = extendedExpiryDays || 180; // default 180 days extension
    const newExpiry = new Date(giftCard.expiryDate.getTime() + addedDays * 24 * 60 * 60 * 1000);

    giftCard.expiryDate = newExpiry;
    giftCard.extendedByAdmin = true;
    giftCard.extendedAt = new Date();
    // Reactivate card if it was expired but now has positive value and future date
    if (giftCard.currentValue > 0) {
      giftCard.isActive = true;
    }
    await giftCard.save();

    return NextResponse.json({
      message: `Gift card expiry extended by ${addedDays} days.`,
      giftCard,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to extend gift card" }, { status: 500 });
  }
}
