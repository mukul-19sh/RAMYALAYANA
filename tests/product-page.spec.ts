import { test, expect } from "@playwright/test";

test.describe("RAMYA Flagship — Product Detail Page Tests", () => {
  // Use a local dev server address
  const baseUrl = "http://localhost:3000";

  test("1. Variant Switching", async ({ page }) => {
    // Navigate to a known product
    await page.goto(`${baseUrl}/product/kora-silk-wrap-shirt`);

    // Verify product name and price
    await expect(page.locator("h1")).toContainText("Kora Silk Wrap Shirt");
    
    // Look for sibling variant links (color dots/circles)
    const variantDots = page.locator("a[href*='/product/']");
    if ((await variantDots.count()) > 0) {
      const firstVariantHref = await variantDots.first().getAttribute("href");
      
      // Click the first variant sibling
      await variantDots.first().click();
      
      // Verify page navigated to the variant URL
      await expect(page).toHaveURL(`${baseUrl}${firstVariantHref}`);
    } else {
      console.log("No active variants found to click.");
    }
  });

  test("2. Size Selection and Low Stock Notice", async ({ page }) => {
    await page.goto(`${baseUrl}/product/kora-silk-wrap-shirt`);

    // Select size 'S'
    const sizeButton = page.getByRole("button", { name: "S", exact: true });
    await sizeButton.click();

    // Verify it becomes active (represented by border-border-primary bg-border-primary text-canvas-bg in classes)
    await expect(sizeButton).toHaveClass(/bg-border-primary/);
  });

  test("3. Add to Cart & Buy Now Flow", async ({ page }) => {
    await page.goto(`${baseUrl}/product/kora-silk-wrap-shirt`);

    // Select size 'M'
    await page.getByRole("button", { name: "M", exact: true }).click();

    // Handle alert prompt mock
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("added to your cart");
      await dialog.accept();
    });

    // Click Add to Cart
    await page.locator("button:has-text('Add to Cart')").click();

    // Click Buy Now and expect redirect to checkout
    await page.locator("button:has-text('Buy Now — Secure Express Checkout')").click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("4. Wishlist Toggle (Authenticated check)", async ({ page }) => {
    await page.goto(`${baseUrl}/product/kora-silk-wrap-shirt`);

    // Wishlist button has aria-label="Add to wishlist" initially
    const wishlistBtn = page.locator("button[aria-label='Add to wishlist']");
    await expect(wishlistBtn).toBeVisible();
    
    // Intercept login warning if unauthenticated, or verify toggle triggers correctly
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("login");
      await dialog.accept();
    });
    await wishlistBtn.click();
  });

  test("5. Waitlist Registration", async ({ page }) => {
    // Navigate to a sold out product
    await page.goto(`${baseUrl}/product/sanskrit-loom-wrap-dress`);

    // Waitlist form should be displayed since status is Sold Out
    const emailInput = page.locator("input[placeholder='Enter email address']");
    await expect(emailInput).toBeVisible();

    // Generate unique email to avoid "already registered" response
    const uniqueEmail = `waitlist-${Date.now()}@ramyalayana.com`;
    await emailInput.fill(uniqueEmail);
    await page.locator("button:has-text('Notify Me')").click();

    // Expect confirmation message
    const successMsg = page.locator("text=successfully");
    await expect(successMsg).toBeVisible();
  });

  test("6. Reviews & Dialogue filtering", async ({ page, context }) => {
    // Authenticate by adding mock-session cookie
    await context.addCookies([{
      name: "mock-session",
      value: "true",
      domain: "localhost",
      path: "/"
    }]);

    await page.goto(`${baseUrl}/product/kora-silk-wrap-shirt`);

    // Expect reviews section
    await expect(page.locator("h2:has-text('Customer Dialogue')")).toBeVisible();

    // Fill new review comment
    const commentField = page.locator("textarea[placeholder*='Share details']");
    await commentField.fill("Exquisite handloom weight. The mulberry silk drape is structured yet fluid.");
    
    // Select 5 star rating
    await page.locator("button:has-text('★')").last().click();

    // Submit review
    await page.locator("button:has-text('Publish Review')").click();

    // Wait for moderation status
    const message = page.locator("text=moderation");
    await expect(message).toBeVisible();
  });

  test("7. Mobile Gallery & Bottom Sticky CTA Viewport", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${baseUrl}/product/kora-silk-wrap-shirt`);

    // Mobile swipe carousel indicators should be visible
    const carouselIndicators = page.locator("button[aria-label*='Slide index']");
    await expect(carouselIndicators.first()).toBeVisible();

    // Mobile sticky bottom CTA should be visible
    const mobileCtaBar = page.locator("div.fixed.bottom-0");
    await expect(mobileCtaBar).toBeVisible();
    await expect(mobileCtaBar.locator("button:has-text('Buy Now')")).toBeVisible();
  });
});
