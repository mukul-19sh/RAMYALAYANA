import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import LoyaltyLedger from "@/models/LoyaltyLedger";
import Coupon from "@/models/Coupon";
import GiftCard from "@/models/GiftCard";
import crypto from "crypto";

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "placeholder_webhook_secret";
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // Strictly check webhook signature validity
    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const eventData = JSON.parse(rawBody);

    if (eventData.event === "payment.captured") {
      await dbConnect();
      const paymentEntity = eventData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const order = await Order.findOneAndUpdate(
        { "paymentDetails.razorpayOrderId": razorpayOrderId, "paymentDetails.status": "pending" },
        {
          $set: {
            "paymentDetails.status": "paid",
            "paymentDetails.razorpayPaymentId": razorpayPaymentId,
            "paymentDetails.paidAt": new Date(),
          },
        },
        { new: true }
      );

      if (!order) {
        // Already processed or not found
        const existingPaidOrder = await Order.findOne({ "paymentDetails.razorpayOrderId": razorpayOrderId, "paymentDetails.status": "paid" });
        if (existingPaidOrder) {
          return NextResponse.json({ success: true, message: "Order already updated" });
        }
        return NextResponse.json({ error: "Order not found or invalid status" }, { status: 404 });
      }

      // Deduct inventory atomically
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
          throw new Error(`Inventory depletion race condition: Size ${item.selectedSize} of product is out of stock.`);
        }

        // Check sold out status
        const updatedProd = await Product.findById(item.product);
        if (updatedProd) {
          const totalQty = updatedProd.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
          if (totalQty <= 0 && updatedProd.status === "Active") {
            updatedProd.status = "Sold Out";
            await updatedProd.save();
          }
        }
      }

      // Update User Loyalty Points & Ledger
      const user = await User.findById(order.user);
      if (user) {
        // Calculate points earned on purchase (1 point per 10 rupees spent)
        const totalPaid = order.items.reduce((sum, i) => sum + i.priceAtPurchase * i.quantity, 0);
        const pointsEarned = Math.floor(totalPaid / 10);

        if (pointsEarned > 0) {
          user.loomClub.points += pointsEarned;
          await user.save();
          await LoyaltyLedger.create({
            user: user._id,
            points: pointsEarned,
            transactionType: "purchase",
            reason: `Points earned on purchase for order ${order.orderNumber}`,
            orderId: order._id,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
