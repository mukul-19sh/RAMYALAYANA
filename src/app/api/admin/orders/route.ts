import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Required for population
import User from "@/models/User"; // Required for population
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const orders = await Order.find({})
      .populate("items.product", "name slug price")
      .populate("user", "email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { orderNumber, orderStatus, carrier, trackingNumber, estimatedDelivery } = await request.json();

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (orderStatus) updateFields.orderStatus = orderStatus;
    
    if (carrier !== undefined) updateFields["shippingDetails.carrier"] = carrier;
    if (trackingNumber !== undefined) updateFields["shippingDetails.trackingNumber"] = trackingNumber;
    if (estimatedDelivery !== undefined) {
      updateFields["shippingDetails.estimatedDelivery"] = estimatedDelivery ? new Date(estimatedDelivery) : null;
    }

    const order = await Order.findOneAndUpdate(
      { orderNumber },
      { $set: updateFields },
      { new: true }
    ).populate("items.product", "name slug price");

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Order updated successfully", order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update order" }, { status: 500 });
  }
}
