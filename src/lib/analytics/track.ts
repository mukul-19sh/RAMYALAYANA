/**
 * Client-side checkout funnel event tracking helper.
 * Fires events to /api/analytics/funnel for aggregation.
 */

export type FunnelEventName =
  | "checkout_started"
  | "shipping_completed"
  | "delivery_selected"
  | "payment_selected"
  | "payment_initiated"
  | "payment_success"
  | "payment_failed"
  | "order_completed";

function getSessionSource(): string {
  if (typeof window === "undefined") return "unknown";
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get("utm_source");
  if (utmSource) return utmSource.toLowerCase();

  const referrer = document.referrer;
  if (!referrer) return "direct";
  if (referrer.includes("instagram.com")) return "instagram";
  if (referrer.includes("google.com")) return "google";
  if (referrer.includes("facebook.com")) return "facebook";
  if (referrer.includes("twitter.com") || referrer.includes("t.co")) return "referral";
  return "referral";
}

function getDeviceType(): "desktop" | "mobile" | "tablet" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getSessionId(userId?: string): string {
  if (typeof window === "undefined") return "unknown";
  if (userId) return userId;
  
  let id = localStorage.getItem("ramya_session_id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("ramya_session_id", id);
  }
  return id;
}

export interface TrackEventOptions {
  orderValue: number;
  orderNumber?: string;
  paymentMethod?: "razorpay" | "cod";
  userId?: string;
}

export async function trackFunnelEvent(
  event: FunnelEventName,
  step: number,
  options: TrackEventOptions
) {
  try {
    const sessionSource = getSessionSource();
    const deviceType = getDeviceType();
    const sessionId = getSessionId(options.userId);
    const sessionType = options.userId ? "authenticated" : "guest";

    await fetch("/api/analytics/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        step,
        sessionType,
        sessionSource,
        deviceType,
        sessionId,
        userId: options.userId,
        orderValue: options.orderValue,
        orderNumber: options.orderNumber,
        paymentMethod: options.paymentMethod,
      }),
    });
  } catch (err) {
    // Silently swallow analytics errors to ensure e-commerce flows are never blocked
    console.warn("Analytics funnel tracking failed:", err);
  }
}
