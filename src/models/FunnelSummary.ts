import mongoose, { Schema, Document, Model } from "mongoose";
import type { SessionSource, DeviceType } from "./CheckoutEvent";

/**
 * FunnelSummary — pre-aggregated checkout funnel metrics.
 *
 * Written by the scheduled aggregation job at /api/admin/analytics/aggregate.
 * Serves as the permanent record after raw CheckoutEvents are purged at 180 days.
 *
 * Each document represents a single combination of:
 *   period × periodStart × sessionSource × paymentMethod × deviceType
 *
 * Upserted (not inserted) on every aggregation run — idempotent by design.
 */

export type FunnelPeriod = "daily" | "weekly" | "monthly";

export interface IFunnelMetrics {
  /** Distinct sessions that fired checkout_started */
  checkoutStarts: number;
  /** Distinct sessions that fired shipping_completed */
  shippingCompleted: number;
  /** Distinct sessions that fired payment_initiated */
  paymentInitiated: number;
  /** Distinct sessions that fired payment_success */
  paymentSuccess: number;
  /** Distinct sessions that fired payment_failed */
  paymentFailure: number;
  /** Distinct sessions that fired order_completed */
  orderCompleted: number;
}

export interface IFunnelSummary extends Document {
  /** Aggregation granularity */
  period: FunnelPeriod;
  /** Inclusive start of the period (UTC midnight) */
  periodStart: Date;
  /** Exclusive end of the period (UTC midnight of next day/week/month) */
  periodEnd: Date;
  /** Traffic source dimension */
  sessionSource: SessionSource;
  /** Payment method dimension — "unknown" if not yet selected at event time */
  paymentMethod: "razorpay" | "cod" | "unknown";
  /** Device category dimension */
  deviceType: DeviceType;
  /** Funnel step session counts for this dimension slice */
  metrics: IFunnelMetrics;
  /** When this summary document was last computed */
  aggregatedAt: Date;
  /** Number of raw CheckoutEvent documents that contributed to this summary */
  rawEventCount: number;
}

const FunnelMetricsSchema = new Schema<IFunnelMetrics>(
  {
    checkoutStarts: { type: Number, required: true, default: 0, min: 0 },
    shippingCompleted: { type: Number, required: true, default: 0, min: 0 },
    paymentInitiated: { type: Number, required: true, default: 0, min: 0 },
    paymentSuccess: { type: Number, required: true, default: 0, min: 0 },
    paymentFailure: { type: Number, required: true, default: 0, min: 0 },
    orderCompleted: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

const FunnelSummarySchema = new Schema<IFunnelSummary>(
  {
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    sessionSource: {
      type: String,
      enum: ["direct", "instagram", "google", "facebook", "referral", "email", "unknown"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod", "unknown"],
      required: true,
      default: "unknown",
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      required: true,
      default: "unknown",
    },
    metrics: { type: FunnelMetricsSchema, required: true },
    aggregatedAt: { type: Date, required: true, default: Date.now },
    rawEventCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: false }
);

/**
 * Unique constraint: one document per (period, periodStart, sessionSource, paymentMethod, deviceType).
 * This enforces idempotency — re-running aggregation for the same period overwrites, never duplicates.
 */
FunnelSummarySchema.index(
  { period: 1, periodStart: 1, sessionSource: 1, paymentMethod: 1, deviceType: 1 },
  { unique: true }
);

// Dashboard query patterns
FunnelSummarySchema.index({ period: 1, periodStart: -1 }); // "Show last N daily/weekly/monthly"
FunnelSummarySchema.index({ period: 1, periodStart: -1, sessionSource: 1 }); // "Breakdown by source"
FunnelSummarySchema.index({ period: 1, periodStart: -1, deviceType: 1 }); // "Breakdown by device"
FunnelSummarySchema.index({ period: 1, periodStart: -1, paymentMethod: 1 }); // "COD vs Razorpay over time"

const FunnelSummary: Model<IFunnelSummary> =
  mongoose.models.FunnelSummary ||
  mongoose.model<IFunnelSummary>("FunnelSummary", FunnelSummarySchema);

export default FunnelSummary;
