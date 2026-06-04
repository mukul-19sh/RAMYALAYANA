import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import BackInStockSubscription from "@/models/BackInStockSubscription";
import Product from "@/models/Product";
import { SubscriptionSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const parseResult = SubscriptionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { product, size, email } = parseResult.data;

    // Verify product exists
    const dbProduct = await Product.findById(product);
    if (!dbProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Upsert subscription to prevent duplicates
    const subscription = await BackInStockSubscription.findOneAndUpdate(
      { product, size, email: email.toLowerCase(), isNotified: false },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: `You will be notified at ${email} when size ${size} of ${dbProduct.name} is restocked.`,
      subscription,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to register subscription" }, { status: 500 });
  }
}
