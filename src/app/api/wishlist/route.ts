import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Wishlist from "@/models/Wishlist";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const wishlist = await Wishlist.findOne({ user: session.user.id }).populate({
      path: "products",
      select: "name price slug images status",
    });

    if (!wishlist) {
      return NextResponse.json({ products: [] });
    }

    return NextResponse.json({ products: wishlist.products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load wishlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { productId } = await request.json();

    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    let wishlist = await Wishlist.findOne({ user: session.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: session.user.id, products: [] });
    }

    const index = wishlist.products.indexOf(productId as any);

    if (index > -1) {
      // Remove from wishlist
      wishlist.products.splice(index, 1);
      await wishlist.save();
      return NextResponse.json({ message: "Product removed from wishlist", inWishlist: false });
    } else {
      // Add to wishlist (max limit of 100 to prevent document bloat)
      if (wishlist.products.length >= 100) {
        return NextResponse.json({ error: "Wishlist cannot exceed 100 items" }, { status: 400 });
      }
      wishlist.products.push(productId as any);
      await wishlist.save();
      return NextResponse.json({ message: "Product added to wishlist", inWishlist: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update wishlist" }, { status: 500 });
  }
}
