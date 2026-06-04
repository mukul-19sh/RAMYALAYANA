import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Waitlist from "@/models/Waitlist";
import Product from "@/models/Product";
import { auth } from "@/auth";
import { WaitlistSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();
    const body = await request.json();
    const parseResult = WaitlistSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, waitlistType, product, selectedSize, collectionSlug, limitedEditionName } = parseResult.data;

    // Cross-validate specific type constraints
    if (waitlistType === "product") {
      if (!product || !selectedSize) {
        return NextResponse.json({ error: "Product ID and selected size are required for product waitlists" }, { status: 400 });
      }
      const dbProduct = await Product.findById(product);
      if (!dbProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    } else if (waitlistType === "collection" && !collectionSlug) {
      return NextResponse.json({ error: "Collection slug is required for collection waitlists" }, { status: 400 });
    } else if (waitlistType === "limited-edition" && !limitedEditionName) {
      return NextResponse.json({ error: "Limited edition name is required for limited edition waitlists" }, { status: 400 });
    }

    // Check for existing unnotified waitlist subscription
    const query: any = {
      email: email.toLowerCase(),
      waitlistType,
      notified: false,
    };
    if (product) query.product = product;
    if (selectedSize) query.selectedSize = selectedSize;
    if (collectionSlug) query.collectionSlug = collectionSlug;
    if (limitedEditionName) query.limitedEditionName = limitedEditionName;

    let waitlistEntry = await Waitlist.findOne(query);

    if (waitlistEntry) {
      return NextResponse.json({
        message: "You are already registered on this waitlist.",
        waitlist: waitlistEntry,
      });
    }

    waitlistEntry = await Waitlist.create({
      email: email.toLowerCase(),
      user: session?.user ? session.user.id : undefined,
      waitlistType,
      product,
      selectedSize,
      collectionSlug,
      limitedEditionName,
      notified: false,
    });

    return NextResponse.json({
      message: "Successfully registered on the waitlist. We will notify you once updates are available.",
      waitlist: waitlistEntry,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit waitlist registration" }, { status: 500 });
  }
}
