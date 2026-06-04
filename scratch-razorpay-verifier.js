const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = "http://localhost:3000";

// Simple helper to load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const parts = line.trim().split('=');
        if (parts.length >= 2 && !line.startsWith('#')) {
          process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
      });
    }
  } catch (e) {
    console.warn("Could not load .env.local", e);
  }
}

async function run() {
  loadEnv();
  console.log("Using Razorpay Secret:", process.env.RAZORPAY_KEY_SECRET ? "LOADED" : "MISSING");

  // 1. Initiate Razorpay Checkout Create
  console.log("1. Initiating order creation...");
  const createRes = await fetch(`${BASE_URL}/api/checkout/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        {
          product: "60c72b2f9b1d8e1f40000006", // Chanderi Silk Stole
          selectedSize: "M",
          quantity: 1
        }
      ],
      contactEmail: "mukul.razorpay@ramya.in",
      paymentMethod: "razorpay",
      deliveryMethod: "standard",
      shippingAddress: {
        street: "789 Weavers Lane",
        city: "Varanasi",
        state: "Uttar Pradesh",
        postalCode: "221001",
        country: "India",
        phone: "9876543210"
      },
      sessionId: "razorpay-test-session"
    })
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    console.error("Order creation failed:", createData);
    process.exit(1);
  }

  const { orderNumber, razorpayOrderId, amount } = createData;
  console.log(`Created Order: ${orderNumber}, Razorpay Order ID: ${razorpayOrderId}, Amount: ${amount}`);

  // 2. Compute a valid signature for mock payment success
  console.log("2. Simulating Razorpay payment success verification...");
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
  const mockPaymentId = "pay_test" + Math.random().toString(36).substring(2, 10);
  
  const signature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${mockPaymentId}`)
    .digest("hex");

  const verifyRes = await fetch(`${BASE_URL}/api/checkout/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: signature,
      orderNumber: orderNumber
    })
  });

  const verifyData = await verifyRes.json();
  console.log("Payment verification response:", verifyData);

  // 3. Connect to database to verify order was saved as paid and inventory was depleted
  console.log("3. Verifying database state...");
  await mongoose.connect("mongodb://127.0.0.1:27017/ramya");
  const db = mongoose.connection.db;

  const orderDoc = await db.collection("orders").findOne({ orderNumber });
  console.log("Order Payment Status in DB:", orderDoc.paymentDetails.status);
  console.log("Order Total Amount in DB:", orderDoc.grandTotal);

  // 4. Simulate a payment failure
  console.log("4. Simulating payment failure event logging...");
  const failEventRes = await fetch(`${BASE_URL}/api/analytics/funnel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "payment_failed",
      step: 7,
      sessionType: "guest",
      sessionSource: "direct",
      deviceType: "desktop",
      sessionId: "razorpay-test-session",
      orderValue: amount,
      orderNumber: orderNumber,
      paymentMethod: "razorpay"
    })
  });
  console.log("Payment failure analytics log response:", await failEventRes.json());

  // Verify payment failed event in DB
  const failEventDoc = await db.collection("checkoutevents").findOne({
    sessionId: "razorpay-test-session",
    event: "payment_failed"
  });
  console.log("Payment Failure Event in DB:", failEventDoc ? "FOUND" : "NOT FOUND");

  // 5. Query Admin Dashboard for aggregated updates
  console.log("5. Querying admin dashboard to verify metrics reconcile...");
  // Make a dashboard request using the mock-admin cookie
  const adminRes = await fetch(`${BASE_URL}/api/admin/analytics/dashboard`, {
    headers: {
      "Cookie": "mock-admin=true"
    }
  });

  const adminData = await adminRes.json();
  if (adminRes.ok) {
    console.log("Reconciled Dashboard Stats:");
    console.log(`- Total Orders: ${adminData.metrics.totalOrders}`);
    console.log(`- Total Revenue: ₹${adminData.metrics.totalRevenue}`);
    console.log(`- Funnel Successful Payments (S6): ${adminData.funnel.payment_success}`);
    console.log(`- Funnel Failed Payments (S7): ${adminData.funnel.payment_failed}`);
  } else {
    console.error("Dashboard metrics failed to load:", adminData);
  }

  await mongoose.disconnect();
  console.log("Razorpay payment verifications completed successfully!");
}

run();
