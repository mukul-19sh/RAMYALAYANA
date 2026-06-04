const { chromium } = require('@playwright/test');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = "C:/Users/Mukul/.gemini/antigravity-ide/brain/e3385b4a-3173-4e06-a246-81ce3a9d36ae";
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("Starting browser session...");
  const browser = await chromium.launch({ headless: true });
  
  // Set up context with default viewport (desktop)
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Homepage
    console.log("Navigating to Homepage...");
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000); // Wait for load
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot-homepage.png") });
    console.log("Homepage screenshot captured.");

    // 2. Product Page
    console.log("Navigating to Product Page...");
    await page.goto(`${BASE_URL}/product/chanderi-silk-stole`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot-product.png") });
    console.log("Product Page screenshot captured.");

    // 3. Add to Cart & Go to Cart
    console.log("Selecting size and adding to cart...");
    // Register dialog handler for cart alert
    page.once('dialog', async (dialog) => {
      console.log(`Accepting alert: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // Select Size M
    const sizeBtn = page.getByRole("button", { name: "M", exact: true });
    await sizeBtn.click();
    await page.waitForTimeout(500);

    // Click Add to Cart
    await page.locator("button:has-text('Add to Cart')").click();
    await page.waitForTimeout(1000);

    // Navigate to /cart
    console.log("Navigating to Cart Page...");
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot-cart.png") });
    console.log("Cart Page screenshot captured.");

    // 4. Proceed to Checkout
    console.log("Navigating to Checkout...");
    await page.locator("button:has-text('Proceed to Checkout')").click();
    await page.waitForURL(/\/checkout/);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot-checkout.png") });
    console.log("Checkout Page screenshot captured.");

    // Fill checkout form fields
    console.log("Filling customer details...");
    await page.fill("input[placeholder='Ananya Sharma']", "Mukul Evidence Test");
    await page.fill("input[placeholder='ananya@example.com']", "mukul.audit@ramya.in");
    await page.fill("input[placeholder='Flat No, Wing, Building Name']", "123 Loom Court Atelier");
    await page.fill("input[placeholder='Mumbai']", "Mumbai");
    await page.fill("input[placeholder='Maharashtra']", "Maharashtra");
    await page.fill("input[placeholder='400001']", "400001");
    await page.fill("input[placeholder='9876543210']", "9876543210");
    await page.waitForTimeout(1000); // wait for COD eligibility check

    console.log("Selecting Express Delivery (fires delivery_selected)...");
    await page.locator("text=Express Delivery").click();
    await page.waitForTimeout(1000);

    // 5. Razorpay Screen Capture
    console.log("Initiating Secure Payment for Razorpay screenshot...");
    // We expect the payment_initiated event, let's click the payment initiation button
    // It will open the Razorpay iframe checkout.js overlay. We take screenshot of that!
    await page.locator("button:has-text('Initiate Secure Payment')").click();
    await page.waitForTimeout(3000); // wait for Razorpay iframe to mount
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot-razorpay.png") });
    console.log("Razorpay Screen screenshot captured.");

    // Reload the page to dismiss the Razorpay modal iframe
    console.log("Reloading checkout to dismiss Razorpay...");
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForTimeout(2000);

    // Refill checkout form for COD flow
    console.log("Refilling customer details for COD...");
    await page.fill("input[placeholder='Ananya Sharma']", "Mukul Evidence Test");
    await page.fill("input[placeholder='ananya@example.com']", "mukul.audit@ramya.in");
    await page.fill("input[placeholder='Flat No, Wing, Building Name']", "123 Loom Court Atelier");
    await page.fill("input[placeholder='Mumbai']", "Mumbai");
    await page.fill("input[placeholder='Maharashtra']", "Maharashtra");
    await page.fill("input[placeholder='400001']", "400001");
    await page.fill("input[placeholder='9876543210']", "9876543210");
    await page.waitForTimeout(2000); // wait for COD eligibility check

    console.log("Selecting Express Delivery for COD...");
    await page.locator("text=Express Delivery").click();
    await page.waitForTimeout(1000);

    // Select COD
    console.log("Selecting Cash On Delivery...");
    await page.locator("text=Cash On Delivery (COD)").click();
    await page.waitForTimeout(500);

    // Place Order
    console.log("Placing COD Order...");
    await page.locator("button:has-text('Place COD Order')").click();
    await page.waitForURL(/\/checkout\/success/);
    await page.waitForTimeout(2000);

    // 6. Success Page
    console.log("Success Page loaded.");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot-success.png") });
    console.log("Success Page screenshot captured.");

    // Get order number from URL/page
    const orderNoText = await page.locator("span.font-mono.font-medium").first().innerText();
    console.log(`Created Order Number: ${orderNoText}`);

    // 7. Admin Dashboard
    console.log("Logging in as Admin and navigating to Admin Dashboard...");
    await context.addCookies([{
      name: "mock-admin",
      value: "true",
      domain: "localhost",
      path: "/"
    }]);

    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot-admin.png") });
    console.log("Admin Dashboard screenshot captured.");

  } catch (error) {
    console.error("Error running screenshot capture browser flow:", error);
  } finally {
    await browser.close();
  }

  // 8. Connect to DB and fetch evidence records
  console.log("Fetching database records from local memory server...");
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/ramya");
    const db = mongoose.connection.db;

    // Fetch latest order
    const latestOrder = await db.collection("orders").find({}).sort({ createdAt: -1 }).limit(1).toArray();
    console.log("Latest Order fetched from DB.");

    // Fetch checkout events
    const checkoutEvents = await db.collection("checkoutevents").find({}).sort({ completedAt: -1 }).limit(15).toArray();
    console.log("CheckoutEvents fetched from DB.");

    const evidence = {
      latestOrder: latestOrder[0] || null,
      checkoutEvents: checkoutEvents
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "database-records.json"),
      JSON.stringify(evidence, null, 2)
    );
    console.log("Database records exported successfully.");

    await mongoose.disconnect();
  } catch (dbError) {
    console.error("Error fetching database records:", dbError);
  }

  console.log("All evidence capture steps completed successfully!");
}

run();
