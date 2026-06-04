import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import { auth } from "@/auth";
import { CheckoutSchema } from "@/lib/validation";
import { getServiceabilityProvider } from "@/lib/serviceability";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    await dbConnect();
    const body = await request.json();
    const parseResult = CheckoutSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { items, appliedCoupon, shippingAddress, paymentMethod, deliveryMethod, contactEmail } = parseResult.data;

    let subtotal = 0;
    const verifiedItems = [];

    // 1. Verify Inventory and Calculate Subtotal from DB prices
    for (const item of items) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct || dbProduct.status === "Archived") {
        return NextResponse.json({ error: `Product not found or unavailable: ${item.product}` }, { status: 404 });
      }

      const sizeInv = dbProduct.inventory.find((inv) => inv.size === item.selectedSize);
      if (!sizeInv || sizeInv.quantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${dbProduct.name} in size ${item.selectedSize}` }, { status: 400 });
      }

      const itemTotal = dbProduct.price * item.quantity;
      subtotal += itemTotal;

      verifiedItems.push({
        product: dbProduct._id,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        priceAtPurchase: dbProduct.price,
      });
    }

    // 2. Apply Coupon
    let couponDiscount = 0;
    if (appliedCoupon) {
      const coupon = await Coupon.findOne({ code: appliedCoupon.toUpperCase(), isActive: true });
      if (coupon && new Date() <= new Date(coupon.expiryDate) && coupon.usageCount < coupon.usageLimit) {
        if (subtotal >= (coupon.minOrderValue || 0)) {
          if (coupon.discountType === "percentage") {
            couponDiscount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
              couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
            }
          } else {
            couponDiscount = coupon.discountValue;
          }
        }
      }
    }

    // 3. Shipping rate
    const shippingAmount = deliveryMethod === "express" ? 200 : 0;
    const grandTotal = Math.max(0, subtotal - couponDiscount + shippingAmount);

    // Generate unique order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `RAMYA-ORD-${dateStr}-${randomSuffix}`;

    // 4. Handle COD specific checks
    if (paymentMethod === "cod") {
      if (grandTotal >= 10000) {
        return NextResponse.json({ error: "COD is not available for orders at or above ₹10,000" }, { status: 400 });
      }
      const provider = getServiceabilityProvider();
      const serviceability = await provider.checkCOD(shippingAddress.postalCode);
      if (!serviceability.codAvailable) {
        return NextResponse.json({ error: "COD is not available for this postal code" }, { status: 400 });
      }
      if (session?.user?.id) {
        const dbUser = await User.findById(session.user.id).select("refusedCodCount").lean();
        if (dbUser && dbUser.refusedCodCount > 0) {
          return NextResponse.json({ error: "COD is not available for this user account" }, { status: 400 });
        }
      }
    }

    // 5. Save order and handle inventory immediately for COD / Free orders
    if (paymentMethod === "cod" || grandTotal === 0) {
      // Deplete stock atomically
      for (const item of verifiedItems) {
        const result = await Product.updateOne(
          {
            _id: item.product,
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
          return NextResponse.json({ error: `Inventory depletion failure: Size ${item.selectedSize} is out of stock.` }, { status: 400 });
        }

        // Check if product is now fully sold out
        const updatedProd = await Product.findById(item.product);
        if (updatedProd) {
          const totalQty = updatedProd.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
          if (totalQty <= 0 && updatedProd.status === "Active") {
            updatedProd.status = "Sold Out";
            await updatedProd.save();
          }
        }
      }

      // Update coupon usage count
      if (appliedCoupon && couponDiscount > 0) {
        await Coupon.updateOne({ code: appliedCoupon.toUpperCase() }, { $inc: { usageCount: 1 } });
      }

      const order = await Order.create({
        orderNumber,
        user: session?.user?.id ? new mongoose.Types.ObjectId(session.user.id) : undefined,
        contactEmail: contactEmail.toLowerCase(),
        items: verifiedItems,
        shippingAddress,
        paymentMethod,
        paymentDetails: {
          razorpayOrderId: paymentMethod === "cod" ? "COD" : "DIRECT_COMPLETION",
          status: paymentMethod === "cod" ? "cod_pending" : "paid",
          paidAt: paymentMethod === "cod" ? undefined : new Date(),
        },
        deliveryMethod,
        orderStatus: "received",
        shippingDetails: {},
        totalAmount: subtotal,
        discountAmount: couponDiscount,
        shippingAmount,
        grandTotal,
        appliedCoupon: appliedCoupon ? appliedCoupon.toUpperCase() : undefined,
      });

      return NextResponse.json({
        success: true,
        orderNumber,
        paymentMethod,
        grandTotal,
        orderId: order._id,
      });
    }

    // 6. Razorpay Flow (amount > 0)
    let razorpayOrderId = "";
    const razorpayOptions = {
      amount: Math.round(grandTotal * 100), // in paise
      currency: "INR",
      receipt: orderNumber,
    };

    try {
      if (process.env.RAZORPAY_KEY_ID === "rzp_test_key" || process.env.RAZORPAY_KEY_ID === "rzp_test_placeholder") {
        console.log("[SANDBOX] Mocking Razorpay order creation for placeholder keys");
        razorpayOrderId = `order_mock_${Date.now()}`;
      } else {
        const rzpOrder = await razorpay.orders.create(razorpayOptions);
        razorpayOrderId = rzpOrder.id;
      }
    } catch (rzpError: any) {
      return NextResponse.json({ error: `Razorpay init error: ${rzpError.message}` }, { status: 520 });
    }

    const order = await Order.create({
      orderNumber,
      user: session?.user?.id ? new mongoose.Types.ObjectId(session.user.id) : undefined,
      contactEmail: contactEmail.toLowerCase(),
      items: verifiedItems,
      shippingAddress,
      paymentMethod,
      paymentDetails: {
        razorpayOrderId,
        status: "pending",
      },
      deliveryMethod,
      orderStatus: "received",
      shippingDetails: {},
      totalAmount: subtotal,
      discountAmount: couponDiscount,
      shippingAmount,
      grandTotal,
      appliedCoupon: appliedCoupon ? appliedCoupon.toUpperCase() : undefined,
    });

    return NextResponse.json({
      success: true,
      orderNumber,
      razorpayOrderId,
      amount: grandTotal,
      currency: "INR",
      orderId: order._id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to initialize checkout" }, { status: 500 });
  }
}
