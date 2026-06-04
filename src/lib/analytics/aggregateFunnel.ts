import dbConnect from "@/lib/mongodb";
import CheckoutEvent from "@/models/CheckoutEvent";
import FunnelSummary, { type FunnelPeriod } from "@/models/FunnelSummary";
import type { SessionSource, DeviceType } from "@/models/CheckoutEvent";

export interface AggregationResult {
  period: FunnelPeriod;
  periodStart: Date;
  periodEnd: Date;
  documentsWritten: number;
  rawEventsProcessed: number;
  durationMs: number;
}

/**
 * The core aggregation pipeline.
 *
 * For a given time window (periodStart → periodEnd):
 *
 * Stage 1 — Filter raw events within the window.
 * Stage 2 — Deduplicate: one row per (sessionId × event × source × method × device).
 *            This converts event counts to unique-session counts at each funnel step.
 * Stage 3 — Count sessions per (event × source × method × device).
 * Stage 4 — Pivot: collapse event rows into metric columns per dimension slice.
 *
 * Each output document maps directly to a FunnelSummary upsert.
 */
async function runAggregationPipeline(periodStart: Date, periodEnd: Date) {
  return CheckoutEvent.aggregate([
    // Stage 1: time window filter — uses the TTL index on completedAt
    {
      $match: {
        completedAt: { $gte: periodStart, $lt: periodEnd },
      },
    },

    // Stage 2: deduplicate — ensures we count sessions, not events
    // A session fires each event at most once per our rate limiter, but this
    // guards against any edge-case duplicates at the DB level.
    {
      $group: {
        _id: {
          sessionId: "$sessionId",
          event: "$event",
          sessionSource: "$sessionSource",
          paymentMethod: { $ifNull: ["$paymentMethod", "unknown"] },
          deviceType: "$deviceType",
        },
        // Carry the count of raw docs that contributed (for rawEventCount)
        rawCount: { $sum: 1 },
      },
    },

    // Stage 3: count unique sessions per (event × dimension slice)
    {
      $group: {
        _id: {
          event: "$_id.event",
          sessionSource: "$_id.sessionSource",
          paymentMethod: "$_id.paymentMethod",
          deviceType: "$_id.deviceType",
        },
        sessionCount: { $sum: 1 },
        rawEventCount: { $sum: "$rawCount" },
      },
    },

    // Stage 4: pivot event rows into metric columns per dimension slice
    {
      $group: {
        _id: {
          sessionSource: "$_id.sessionSource",
          paymentMethod: "$_id.paymentMethod",
          deviceType: "$_id.deviceType",
        },
        checkoutStarts: {
          $sum: {
            $cond: [{ $eq: ["$_id.event", "checkout_started"] }, "$sessionCount", 0],
          },
        },
        shippingCompleted: {
          $sum: {
            $cond: [{ $eq: ["$_id.event", "shipping_completed"] }, "$sessionCount", 0],
          },
        },
        paymentInitiated: {
          $sum: {
            $cond: [{ $eq: ["$_id.event", "payment_initiated"] }, "$sessionCount", 0],
          },
        },
        paymentSuccess: {
          $sum: {
            $cond: [{ $eq: ["$_id.event", "payment_success"] }, "$sessionCount", 0],
          },
        },
        paymentFailure: {
          $sum: {
            $cond: [{ $eq: ["$_id.event", "payment_failed"] }, "$sessionCount", 0],
          },
        },
        orderCompleted: {
          $sum: {
            $cond: [{ $eq: ["$_id.event", "order_completed"] }, "$sessionCount", 0],
          },
        },
        rawEventCount: { $sum: "$rawEventCount" },
      },
    },
  ]);
}

/**
 * Aggregates raw CheckoutEvent data for a given period window and upserts
 * FunnelSummary documents. Idempotent — safe to re-run for the same period.
 *
 * @param period - "daily" | "weekly" | "monthly"
 * @param periodStart - UTC start of period (inclusive)
 * @param periodEnd - UTC end of period (exclusive)
 */
export async function aggregateFunnelPeriod(
  period: FunnelPeriod,
  periodStart: Date,
  periodEnd: Date
): Promise<AggregationResult> {
  const startTime = Date.now();
  await dbConnect();

  const rows = await runAggregationPipeline(periodStart, periodEnd);

  if (rows.length === 0) {
    return {
      period,
      periodStart,
      periodEnd,
      documentsWritten: 0,
      rawEventsProcessed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  const aggregatedAt = new Date();
  let totalRawEvents = 0;

  // Upsert each dimension slice as its own FunnelSummary document
  const upsertOps = rows.map((row) => {
    totalRawEvents += row.rawEventCount;
    return {
      updateOne: {
        filter: {
          period,
          periodStart,
          sessionSource: row._id.sessionSource as SessionSource,
          paymentMethod: row._id.paymentMethod,
          deviceType: row._id.deviceType as DeviceType,
        },
        update: {
          $set: {
            periodEnd,
            metrics: {
              checkoutStarts: row.checkoutStarts,
              shippingCompleted: row.shippingCompleted,
              paymentInitiated: row.paymentInitiated,
              paymentSuccess: row.paymentSuccess,
              paymentFailure: row.paymentFailure,
              orderCompleted: row.orderCompleted,
            },
            aggregatedAt,
            rawEventCount: row.rawEventCount,
          },
        },
        upsert: true,
      },
    };
  });

  await FunnelSummary.bulkWrite(upsertOps, { ordered: false });

  return {
    period,
    periodStart,
    periodEnd,
    documentsWritten: rows.length,
    rawEventsProcessed: totalRawEvents,
    durationMs: Date.now() - startTime,
  };
}

// ─── Period boundary helpers ──────────────────────────────────────────────────

/** Returns the UTC midnight start of a given date */
export function utcDayStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns UTC midnight of the day after a given date */
export function utcDayEnd(date: Date): Date {
  const d = utcDayStart(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/** Returns UTC Monday midnight of the ISO week containing the given date */
export function utcWeekStart(date: Date): Date {
  const d = utcDayStart(date);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Returns UTC Monday midnight of the week after the week containing the given date */
export function utcWeekEnd(date: Date): Date {
  const start = utcWeekStart(date);
  start.setUTCDate(start.getUTCDate() + 7);
  return start;
}

/** Returns UTC midnight of the first day of the month containing the given date */
export function utcMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Returns UTC midnight of the first day of the next month */
export function utcMonthEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}
