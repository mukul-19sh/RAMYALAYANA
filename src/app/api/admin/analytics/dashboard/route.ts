import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product"; // For aggregate lookup
import CheckoutEvent from "@/models/CheckoutEvent";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    // 1. Total Orders count (Successful / Completed checkout)
    const totalOrders = await Order.countDocuments({
      "paymentDetails.status": { $in: ["paid", "cod_pending"] },
    });

    // 2. Total Revenue
    const revenueResult = await Order.aggregate([
      { $match: { "paymentDetails.status": { $in: ["paid", "cod_pending"] } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 3. Funnel Steps from CheckoutEvents (Unique sessions count at each step)
    const funnelSteps = await CheckoutEvent.aggregate([
      {
        $group: {
          _id: { event: "$event", sessionId: "$sessionId" },
        },
      },
      {
        $group: {
          _id: "$_id.event",
          uniqueSessions: { $sum: 1 },
        },
      },
    ]);

    const funnel: Record<string, number> = {
      checkout_started: 0,
      shipping_completed: 0,
      delivery_selected: 0,
      payment_selected: 0,
      payment_initiated: 0,
      payment_success: 0,
      payment_failed: 0,
      order_completed: 0,
    };

    funnelSteps.forEach((step) => {
      if (step._id in funnel) {
        funnel[step._id] = step.uniqueSessions;
      }
    });

    // 4. Rate computations
    const checkoutStarts = funnel.checkout_started || 1;
    const orderCompletions = funnel.order_completed || 0;
    const conversionRate = Math.min(100, (orderCompletions / checkoutStarts) * 100);
    const dropRate = 100 - conversionRate;

    const paymentInitiated = funnel.payment_initiated || 1;
    const paymentFailed = funnel.payment_failed || 0;
    const paymentFailureRate = Math.min(100, (paymentFailed / paymentInitiated) * 100);

    // 5. Top Products by Quantity Sold
    const topProducts = await Order.aggregate([
      { $match: { "paymentDetails.status": { $in: ["paid", "cod_pending"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          quantitySold: { $sum: "$items.quantity" },
          revenueGenerated: { $sum: { $multiply: ["$items.priceAtPurchase", "$items.quantity"] } },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          quantitySold: 1,
          revenueGenerated: 1,
          name: { $ifNull: ["$productDetails.name", "Archived Product"] },
          slug: { $ifNull: ["$productDetails.slug", "#"] },
          price: { $ifNull: ["$productDetails.price", 0] },
        },
      },
    ]);

    // 6. Recent Failed Payments
    const failedPayments = await CheckoutEvent.find({ event: "payment_failed" })
      .select("orderNumber orderValue completedAt sessionId deviceType")
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      metrics: {
        totalOrders,
        totalRevenue,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        dropRate: parseFloat(dropRate.toFixed(2)),
        paymentFailureRate: parseFloat(paymentFailureRate.toFixed(2)),
      },
      funnel,
      topProducts,
      failedPayments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to compile dashboard metrics" }, { status: 500 });
  }
}
