import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cart from "@/models/Cart";
import { auth } from "@/auth";
import { CartSyncSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const cart = await Cart.findOne({ user: session.user.id }).populate({
      path: "items.product",
      select: "name price slug images inventory status",
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: cart.items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const parseResult = CartSyncSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { items } = parseResult.data;

    // Overwrite database cart for the user
    const cart = await Cart.findOneAndUpdate(
      { user: session.user.id },
      { items },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: "Cart synced successfully", items: cart.items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to sync cart" }, { status: 500 });
  }
}
