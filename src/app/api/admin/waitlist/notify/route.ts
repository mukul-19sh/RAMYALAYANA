import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Waitlist from "@/models/Waitlist";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { waitlistType, product, collectionSlug, limitedEditionName } = await request.json();

    const query: any = {
      waitlistType,
      notified: false,
    };

    if (waitlistType === "product") {
      if (!product) return NextResponse.json({ error: "Product ID required" }, { status: 400 });
      query.product = product;
    } else if (waitlistType === "collection") {
      if (!collectionSlug) return NextResponse.json({ error: "Collection slug required" }, { status: 400 });
      query.collectionSlug = collectionSlug;
    } else if (waitlistType === "limited-edition") {
      if (!limitedEditionName) return NextResponse.json({ error: "Limited edition name required" }, { status: 400 });
      query.limitedEditionName = limitedEditionName;
    } else {
      return NextResponse.json({ error: "Invalid waitlist type" }, { status: 400 });
    }

    const waitlistEntries = await Waitlist.find(query);

    if (waitlistEntries.length === 0) {
      return NextResponse.json({ message: "No pending waitlist customers found." });
    }

    const emails = waitlistEntries.map((entry) => entry.email);

    // Simulate sending email notification in background. Update notified status in database.
    await Waitlist.updateMany(query, {
      $set: {
        notified: true,
        notifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Alerts dispatched successfully to ${emails.length} waitlisted users.`,
      notifiedEmails: emails,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to trigger waitlist notifications" }, { status: 500 });
  }
}
