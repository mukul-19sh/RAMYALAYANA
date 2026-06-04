import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CheckoutEvent from "@/models/CheckoutEvent";
import { FunnelEventSchema } from "@/lib/validation";

// Simple in-memory rate limiter per sessionId (resets on cold start — intentional)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 5_000; // 5 seconds between duplicate events from same session

/**
 * POST /api/analytics/funnel
 *
 * Lightweight endpoint for recording checkout funnel events.
 * No authentication required — guest events must be tracked.
 *
 * Rate-limited by sessionId to prevent flooding (5 second debounce per session).
 * Silently discards malformed payloads rather than returning errors,
 * so network failures in the UI never block the user's checkout flow.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parse = FunnelEventSchema.safeParse(body);

    if (!parse.success) {
      // Silently accept — never return errors that could interrupt checkout
      return NextResponse.json({ ok: true });
    }

    const data = parse.data;

    // ── Rate limiting ────────────────────────────────────────────────────────
    const rateLimitKey = `${data.sessionId}:${data.event}`;
    const lastSeen = rateLimitMap.get(rateLimitKey);
    const now = Date.now();

    if (lastSeen && now - lastSeen < RATE_LIMIT_WINDOW_MS) {
      // Duplicate event within window — silently discard
      return NextResponse.json({ ok: true });
    }
    rateLimitMap.set(rateLimitKey, now);

    // Prune map to prevent unbounded memory growth (keep last 10,000 entries)
    if (rateLimitMap.size > 10_000) {
      const oldestKey = rateLimitMap.keys().next().value;
      if (oldestKey) rateLimitMap.delete(oldestKey);
    }

    // ── Write to analytics store ─────────────────────────────────────────────
    await dbConnect();

    await CheckoutEvent.create({
      event: data.event,
      step: data.step,
      sessionType: data.sessionType,
      sessionSource: data.sessionSource,
      deviceType: data.deviceType,
      sessionId: data.sessionId,
      userId: data.userId ?? undefined,
      orderValue: data.orderValue,
      orderNumber: data.orderNumber ?? undefined,
      paymentMethod: data.paymentMethod ?? undefined,
      completedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never block checkout over analytics failure
    return NextResponse.json({ ok: true });
  }
}
