import { z } from "zod";

export const ProductCreateSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(1),
  description: z.object({
    editorial: z.string().min(10),
    fit: z.string().min(5),
    artisanDetails: z.string().min(10),
  }),
  price: z.number().nonnegative(),
  category: z.enum(["atelier", "silhouette", "foundations", "archive"]),
  subCategory: z.enum(["dresses", "tops", "bottoms", "jackets", "coords", "occasion", "new"]),
  images: z.object({
    lookbook: z.array(z.string().url()).default([]),
    studioFront: z.string().url(),
    studioBack: z.string().url(),
    studioDetail: z.string().url(),
  }),
  inventory: z.array(
    z.object({
      size: z.enum(["XS", "S", "M", "L", "XL"]),
      quantity: z.number().int().nonnegative(),
    })
  ).min(1),
  artisanMetadata: z.object({
    weaverName: z.string().min(1),
    loomCoordinates: z.string().min(1),
    hoursToWeave: z.number().positive(),
    region: z.string().min(1),
  }),
  status: z.enum(["Active", "Sold Out", "Archived"]).default("Active"),
  variantGroupId: z.string().optional(),
  variantColor: z
    .object({
      name: z.string(),
      hex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    })
    .optional(),
  variantFabric: z.string().optional(),
});

export const ReviewCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

export const CartItemSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
  selectedSize: z.enum(["XS", "S", "M", "L", "XL"]),
  quantity: z.number().int().positive(),
});

export const CartSyncSchema = z.object({
  items: z.array(CartItemSchema),
});

export const CouponValidateSchema = z.object({
  code: z.string().min(1).toUpperCase(),
});

export const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  contactEmail: z.string().email("A valid email is required for order confirmation"),
  paymentMethod: z.enum(["razorpay", "cod"]),
  deliveryMethod: z.enum(["standard", "express"]).default("standard"),
  appliedCoupon: z.string().optional(),
  appliedGiftCards: z.array(z.string().min(4)).optional(), // Array of raw gift card codes to verify
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(6).max(6, "Enter a valid 6-digit PIN code"),
    country: z.string().min(1),
    phone: z.string().min(10).max(15),
  }),
  redeemPoints: z.number().int().nonnegative().optional(),
  sessionId: z.string().min(1), // For funnel analytics tracking
});

export const CodEligibilitySchema = z.object({
  postalCode: z.string().min(6).max(6),
  orderValue: z.number().positive(),
  sessionId: z.string().min(1),
  sessionSource: z
    .enum(["direct", "instagram", "google", "facebook", "referral", "email", "unknown"])
    .default("unknown"),
});

export const FunnelEventSchema = z.object({
  event: z.enum([
    "checkout_started",
    "shipping_completed",
    "delivery_selected",
    "payment_selected",
    "payment_initiated",
    "payment_success",
    "payment_failed",
    "order_completed",
  ]),
  step: z.number().int().min(1).max(8),
  sessionType: z.enum(["guest", "authenticated"]),
  sessionSource: z
    .enum(["direct", "instagram", "google", "facebook", "referral", "email", "unknown"])
    .default("unknown"),
  deviceType: z.enum(["desktop", "mobile", "tablet", "unknown"]).default("unknown"),
  sessionId: z.string().min(1),
  userId: z.string().optional(),
  orderValue: z.number().nonnegative(),
  orderNumber: z.string().optional(),
  paymentMethod: z.enum(["razorpay", "cod"]).optional(),
});

export const SubscriptionSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
  size: z.enum(["XS", "S", "M", "L", "XL"]),
  email: z.string().email(),
});

export const WaitlistSchema = z.object({
  email: z.string().email(),
  waitlistType: z.enum(["product", "collection", "limited-edition"]),
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID").optional(),
  selectedSize: z.enum(["XS", "S", "M", "L", "XL"]).optional(),
  collectionSlug: z.string().min(1).optional(),
  limitedEditionName: z.string().min(1).optional(),
});
