import { test, expect } from "@playwright/test";

test.describe("RAMYALAYANA Flagship — Checkout & Order Journey E2E Tests", () => {
  const baseUrl = "http://localhost:3000";

  test("1. Full Purchase Journey via COD (Guest Checkout)", async ({ page }) => {
    // Step A: Browse Product & Add to Cart
    await page.goto(`${baseUrl}/product/chanderi-silk-stole`);
    await expect(page.locator("h1")).toContainText("Chanderi Silk Stole");

    // Select Size 'M'
    const sizeButton = page.getByRole("button", { name: "M", exact: true });
    await sizeButton.click();
    await expect(sizeButton).toHaveClass(/bg-border-primary/);

    // Click Buy Now to add to cart and redirect
    await page.locator("button:has-text('Buy Now — Secure Express Checkout')").click();
    await expect(page).toHaveURL(`${baseUrl}/checkout`);

    // Step B: Fill Customer Identity
    await page.fill("input[placeholder='Ananya Sharma']", "Mukul Test");
    await page.fill("input[placeholder='ananya@example.com']", "mukul.guest@ramya.in");

    // Step C: Fill Dispatch Address
    await page.fill("input[placeholder='Flat No, Wing, Building Name']", "123 Loom Atelier Lane");
    await page.fill("input[placeholder='Mumbai']", "Mumbai");
    await page.fill("input[placeholder='Maharashtra']", "Maharashtra");
    
    // Fill pincode
    const pinField = page.locator("input[placeholder='400001']");
    await pinField.fill("400001");
    
    // Fill phone number
    await page.fill("input[placeholder='9876543210']", "9876543210");

    // Step D: Validate Delivery Method
    const expressDelivery = page.locator("text=Express Delivery");
    await expressDelivery.click();
    // Shipping cost should update to 200 in summary

    // Wait for COD eligibility checks to execute and settle
    await page.waitForTimeout(2000);

    // Step E: Select Cash On Delivery (COD) payment
    const codOption = page.locator("text=Cash On Delivery (COD)");
    await expect(codOption).toBeVisible();
    await codOption.click();

    // Step F: Place order
    await page.locator("button:has-text('Place COD Order')").click();

    // Step G: Success page redirect verify
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.locator("h1")).toContainText("Thank you for your Order");
    
    const orderNoText = await page.locator("span.font-mono.font-medium").first().innerText();
    expect(orderNoText).toContain("RAMYA-ORD-");

    // Step H: Navigate to tracking
    await page.locator("button:has-text('Track Order Status')").click();
    await expect(page).toHaveURL(/\/account\/orders/);
    
    // Stepper should render steps
    await expect(page.locator("text=Order Received")).toBeVisible();
  });
});
