import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import { getServiceabilityProvider } from "@/lib/serviceability";
import { CodEligibilitySchema } from "@/lib/validation";

// COD is blocked for orders at or above this threshold
const COD_VALUE_LIMIT = 10_000;

/**
 * POST /api/checkout/cod-eligible
 *
 * Returns { eligible: boolean } — nothing more.
 * Internal eligibility reasons are NEVER exposed to the client.
 *
 * Three-gate check (all must pass):
 *   1. Order value < ₹10,000
 *   2. Postal code is serviceable for COD (via active provider)
 *   3. Authenticated user has zero refused COD deliveries (guests skip this gate)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parse = CodEligibilitySchema.safeParse(body);

    if (!parse.success) {
      // Return ineligible on bad input — never leak validation details
      return NextResponse.json({ eligible: false });
    }

    const { postalCode, orderValue } = parse.data;

    // ── Gate 1: Order value ──────────────────────────────────────────────────
    if (orderValue >= COD_VALUE_LIMIT) {
      return NextResponse.json({ eligible: false });
    }

    // ── Gate 2: PIN serviceability ───────────────────────────────────────────
    const provider = getServiceabilityProvider();
    const serviceability = await provider.checkCOD(postalCode);

    if (!serviceability.codAvailable) {
      return NextResponse.json({ eligible: false });
    }

    // ── Gate 3: Refused COD history (authenticated users only) ───────────────
    const session = await auth();
    if (session?.user?.id) {
      await dbConnect();
      const dbUser = await User.findById(session.user.id).select("refusedCodCount").lean();
      if (dbUser && dbUser.refusedCodCount > 0) {
        return NextResponse.json({ eligible: false });
      }
    }
    // Guest users: Gate 3 is skipped — cannot verify history without account

    return NextResponse.json({ eligible: true });
  } catch {
    // Fail closed on unexpected errors — do not allow COD on system errors
    return NextResponse.json({ eligible: false });
  }
}
