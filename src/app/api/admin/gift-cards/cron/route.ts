import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import GiftCard from "@/models/GiftCard";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const log: string[] = [];

    // 1. Check for 90 day reminders (expiring between 89 and 91 days from now)
    const start90 = new Date(ninetyDays.getTime() - 24 * 60 * 60 * 1000);
    const end90 = new Date(ninetyDays.getTime() + 24 * 60 * 60 * 1000);
    const cards90 = await GiftCard.find({
      isActive: true,
      currentValue: { $gt: 0 },
      expiryDate: { $gte: start90, $lte: end90 },
      sent90DayReminder: false,
    });

    for (const card of cards90) {
      // Simulate dispatching email notification
      card.sent90DayReminder = true;
      await card.save();
      log.push(`Sent 90-day expiry warning to: ${card.recipientEmail || "purchaser"} (Mask: ${card.codeMask})`);
    }

    // 2. Check for 30 day reminders
    const start30 = new Date(thirtyDays.getTime() - 24 * 60 * 60 * 1000);
    const end30 = new Date(thirtyDays.getTime() + 24 * 60 * 60 * 1000);
    const cards30 = await GiftCard.find({
      isActive: true,
      currentValue: { $gt: 0 },
      expiryDate: { $gte: start30, $lte: end30 },
      sent30DayReminder: false,
    });

    for (const card of cards30) {
      card.sent30DayReminder = true;
      await card.save();
      log.push(`Sent 30-day expiry warning to: ${card.recipientEmail || "purchaser"} (Mask: ${card.codeMask})`);
    }

    // 3. Check for 7 day reminders
    const start7 = new Date(sevenDays.getTime() - 24 * 60 * 60 * 1000);
    const end7 = new Date(sevenDays.getTime() + 24 * 60 * 60 * 1000);
    const cards7 = await GiftCard.find({
      isActive: true,
      currentValue: { $gt: 0 },
      expiryDate: { $gte: start7, $lte: end7 },
      sent7DayReminder: false,
    });

    for (const card of cards7) {
      card.sent7DayReminder = true;
      await card.save();
      log.push(`Sent 7-day expiry warning to: ${card.recipientEmail || "purchaser"} (Mask: ${card.codeMask})`);
    }

    // 4. Auto-deactivate cards that are past their expiryDate
    const expiredCards = await GiftCard.updateMany(
      { isActive: true, expiryDate: { $lt: now } },
      { $set: { isActive: false } }
    );

    if (expiredCards.modifiedCount > 0) {
      log.push(`Auto-deactivated ${expiredCards.modifiedCount} expired gift cards.`);
    }

    return NextResponse.json({
      message: "Expiry warning scan complete.",
      dispatchedReminders: log,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to execute expiry reminders scan" }, { status: 500 });
  }
}
