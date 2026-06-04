import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  aggregateFunnelPeriod,
  utcDayStart,
  utcDayEnd,
  utcWeekStart,
  utcWeekEnd,
  utcMonthStart,
  utcMonthEnd,
  type AggregationResult,
} from "@/lib/analytics/aggregateFunnel";
import type { FunnelPeriod } from "@/models/FunnelSummary";

/**
 * POST /api/admin/analytics/aggregate
 *
 * Rolls up raw CheckoutEvent data into FunnelSummary aggregates.
 * Admin-only. Called by an external cron scheduler (Vercel Cron, GitHub Actions, etc.)
 *
 * Request body:
 * {
 *   "periods": ["daily", "weekly", "monthly"],   // which granularities to run
 *   "targetDate": "2026-05-31"                   // ISO date of the period to aggregate (optional, defaults to yesterday)
 * }
 *
 * Idempotent — re-running for the same period upserts, never duplicates.
 *
 * Scheduling recommendation:
 *   Daily  → run at 00:05 UTC every day (aggregates yesterday)
 *   Weekly → run at 00:10 UTC every Monday (aggregates last week)
 *   Monthly → run at 00:15 UTC on the 1st of every month (aggregates last month)
 *
 * IMPORTANT: Must run BEFORE the 180-day TTL window closes for the target period.
 * Recommended: run daily aggregation every day to ensure no data loss.
 */
export async function POST(request: NextRequest) {
  // ── Auth guard: admin only ─────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role by looking at a server-side header set by middleware,
  // or fall back to checking the CRON_SECRET for scheduler-initiated calls.
  const cronSecret = request.headers.get("x-cron-secret");
  const isScheduler = cronSecret && cronSecret === process.env.CRON_SECRET;
  const isAdmin = (session.user as any).role === "admin";

  if (!isScheduler && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Parse request ──────────────────────────────────────────────────────────
  let body: { periods?: FunnelPeriod[]; targetDate?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Default to all periods, yesterday
  }

  const periods: FunnelPeriod[] = body.periods ?? ["daily", "weekly", "monthly"];
  const targetDate = body.targetDate ? new Date(body.targetDate) : new Date();

  // Validate periods
  const validPeriods: FunnelPeriod[] = ["daily", "weekly", "monthly"];
  const invalidPeriods = periods.filter((p) => !validPeriods.includes(p));
  if (invalidPeriods.length > 0) {
    return NextResponse.json(
      { error: `Invalid periods: ${invalidPeriods.join(", ")}` },
      { status: 400 }
    );
  }

  if (isNaN(targetDate.getTime())) {
    return NextResponse.json({ error: "Invalid targetDate" }, { status: 400 });
  }

  // ── Run aggregations ───────────────────────────────────────────────────────
  const results: AggregationResult[] = [];
  const errors: string[] = [];

  // "yesterday" relative to targetDate for daily
  const yesterday = new Date(targetDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  for (const period of periods) {
    try {
      let periodStart: Date;
      let periodEnd: Date;

      switch (period) {
        case "daily":
          // Always aggregate the day before targetDate
          periodStart = utcDayStart(yesterday);
          periodEnd = utcDayEnd(yesterday);
          break;

        case "weekly":
          // Aggregate the ISO week that contains yesterday
          periodStart = utcWeekStart(yesterday);
          periodEnd = utcWeekEnd(yesterday);
          break;

        case "monthly":
          // Aggregate the calendar month that contains yesterday
          periodStart = utcMonthStart(yesterday);
          periodEnd = utcMonthEnd(yesterday);
          break;
      }

      const result = await aggregateFunnelPeriod(period, periodStart, periodEnd);
      results.push(result);
    } catch (err: any) {
      errors.push(`${period}: ${err.message ?? "Unknown error"}`);
    }
  }

  const status = errors.length > 0 && results.length === 0 ? 500 : 207;

  return NextResponse.json(
    {
      success: errors.length === 0,
      targetDate: yesterday.toISOString().slice(0, 10),
      results: results.map((r) => ({
        period: r.period,
        periodStart: r.periodStart.toISOString().slice(0, 10),
        periodEnd: r.periodEnd.toISOString().slice(0, 10),
        documentsWritten: r.documentsWritten,
        rawEventsProcessed: r.rawEventsProcessed,
        durationMs: r.durationMs,
      })),
      errors: errors.length > 0 ? errors : undefined,
    },
    { status }
  );
}
