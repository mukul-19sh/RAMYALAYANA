import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderNumber, appliedCoupon } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing signature parameters" }, { status: 400 });
    }

    // 1. Verify Razorpay Signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Mark Order as Paid atomically to prevent race condition with webhook
    const order = (await Order.findOneAndUpdate(
      { orderNumber, "paymentDetails.status": "pending" },
      {
        $set: {
          "paymentDetails.status": "paid",
          "paymentDetails.razorpayPaymentId": razorpay_payment_id,
          "paymentDetails.razorpaySignature": razorpay_signature,
          "paymentDetails.paidAt": new Date(),
        },
      },
      { new: true }
    )) as any;

    if (!order) {
      // Order was already marked paid (processed by webhook concurrently) or doesn't exist
      const existingPaidOrder = await Order.findOne({ orderNumber, "paymentDetails.status": "paid" });
      if (existingPaidOrder) {
        return NextResponse.json({ success: true, message: "Payment already verified" });
      }
      return NextResponse.json({ error: "Order not found or invalid status" }, { status: 404 });
    }

    // 3. Update Product Stock levels atomically and update status to "Sold Out" if quantity hits 0
    for (const item of order.items) {
      const result = await Product.updateOne(
        {
          _id: item.product as any,
          inventory: {
            $elemMatch: {
              size: item.selectedSize,
              quantity: { $gte: item.quantity },
            },
          },
        },
        { $inc: { "inventory.$.quantity": -item.quantity } }
      );

      if (result.modifiedCount === 0) {
        throw new Error(`Inventory depletion failure: Size ${item.selectedSize} of product is out of stock.`);
      }

      // Check if product is now fully sold out across all sizes
      const updatedProd = await Product.findById(item.product);
      if (updatedProd) {
        const totalQty = updatedProd.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        if (totalQty <= 0 && updatedProd.status === "Active") {
          updatedProd.status = "Sold Out";
          await updatedProd.save();
        }
      }
    }

    // 4. Update Coupon Usage Count if applicable
    if (appliedCoupon) {
      await Coupon.updateOne({ code: appliedCoupon.toUpperCase() }, { $inc: { usageCount: 1 } });
    }

    return NextResponse.json({ success: true, message: "Payment verified and inventory updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 500 });
  }
}
