import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Waitlist from "@/models/Waitlist";
import BackInStockSubscription from "@/models/BackInStockSubscription";
import { auth } from "@/auth";
import { ProductCreateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    const parseResult = ProductCreateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const product = await Product.create(parseResult.data);
    return NextResponse.json({ message: "Product created successfully", product }, { status: 210 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid or missing product ID" }, { status: 400 });
    }

    const body = await request.json();
    // Validate inputs using Zod
    const parseResult = ProductCreateSchema.partial().safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Capture stock details before updating for notifications comparison
    const originalInventory = [...product.inventory];

    // Apply updates
    Object.assign(product, parseResult.data);
    await product.save();

    // Check if any size was restocked from 0 to > 0 to trigger back-in-stock logic
    for (const invItem of product.inventory) {
      const origSize = originalInventory.find((o) => o.size === invItem.size);
      const origQty = origSize ? origSize.quantity : 0;

      if (origQty === 0 && invItem.quantity > 0) {
        // Trigger background lookup of waitlists / subscriptions for sizes
        const pendingSubscriptions = await BackInStockSubscription.find({
          product: product._id,
          size: invItem.size,
          isNotified: false,
        });

        // Simulating immediate dispatch (we record notified status in db)
        if (pendingSubscriptions.length > 0) {
          await BackInStockSubscription.updateMany(
            { product: product._id, size: invItem.size, isNotified: false },
            { $set: { isNotified: true, notifiedAt: new Date() } }
          );
        }
      }
    }

    return NextResponse.json({ message: "Product updated successfully", product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid or missing product ID" }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Set status to Archived instead of hard deleting (user request)
    product.status = "Archived";
    await product.save();

    return NextResponse.json({ message: "Product archived successfully (remains SEO indexable)" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to archive product" }, { status: 500 });
  }
}
