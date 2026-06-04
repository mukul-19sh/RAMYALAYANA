import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Required for population
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const { searchParams } = request.nextUrl;
    const email = searchParams.get("email")?.toLowerCase().trim();

    await dbConnect();
    const order = await Order.findOne({ orderNumber })
      .populate("items.product", "name slug price images");

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const session = await auth();

    // Verification check:
    // 1. If it belongs to an authenticated user, verify session matches.
    // 2. If it's a guest order, verify that the email query parameter matches contactEmail.
    const isOwner = session?.user?.id && order.user && order.user.toString() === session.user.id;
    const isMatchingGuest = email && order.contactEmail === email;

    if (!isOwner && !isMatchingGuest) {
      return NextResponse.json({ error: "Unauthorized access to order details" }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch order details" }, { status: 500 });
  }
}
